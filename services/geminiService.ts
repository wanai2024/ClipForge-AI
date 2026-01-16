import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

/**
 * Helper to get the correct client instance.
 * Prioritizes custom key -> env key.
 */
const getClient = (customKey?: string) => {
  // Ensure we trim whitespace from manually entered keys
  const apiKey = customKey?.trim() || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please enter your Google Gemini API Key.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * helper to strip the "data:image/xyz;base64," prefix for the API
 */
const stripBase64Prefix = (dataUrl: string): string => {
  return dataUrl.split(',')[1] || dataUrl;
};

const getMimeType = (dataUrl: string): string => {
  return dataUrl.split(';')[0].split(':')[1] || 'image/png';
}

/**
 * Analyzes an image frame to generate descriptive prompts.
 */
export const analyzeFrame = async (base64Image: string, apiKey?: string): Promise<AnalysisResult> => {
  try {
    const ai = getClient(apiKey);
    const cleanBase64 = stripBase64Prefix(base64Image);
    const mimeType = getMimeType(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this video frame. Return a JSON object with two keys: 'chineseDescription' (a detailed description of the scene in Chinese) and 'englishPrompt' (a high-quality, detailed English text-to-image prompt suitable for Generative AI)."
          },
        ],
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      try {
        const json = JSON.parse(response.text);
        return {
          chineseDescription: json.chineseDescription || "无法生成中文描述",
          englishPrompt: json.englishPrompt || "Could not generate prompt",
        };
      } catch (e) {
        console.error("JSON Parse Error", e);
        return {
          chineseDescription: "解析响应失败",
          englishPrompt: response.text
        };
      }
    }
    throw new Error("No text response received from Gemini.");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates new images based on a text prompt.
 * Supports generating multiple images by parallel requests (since flash-image generates 1 per req).
 */
export const generateImageFromPrompt = async (
  prompt: string, 
  aspectRatio: string = "1:1", 
  count: number = 1,
  apiKey?: string
): Promise<string[]> => {
  try {
    const ai = getClient(apiKey);

    // Create an array of promises based on the count
    const promises = Array.from({ length: count }).map(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: { aspectRatio: aspectRatio }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("No content generated.");

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found in response.");
    });

    // Execute all requests
    const results = await Promise.all(promises);
    return results;

  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

/**
 * Generates a video from an image using Veo.
 * Can optionally take an endImageBase64 to generate video between two frames.
 */
export const generateVideoFromImage = async (
  imageBase64: string, 
  prompt: string, 
  aspectRatio: string = "16:9",
  apiKey?: string,
  endImageBase64?: string
): Promise<string> => {
  try {
    const aiClient = getClient(apiKey);
    
    const cleanBase64 = stripBase64Prefix(imageBase64);
    const mimeType = getMimeType(imageBase64);
    
    let targetAspectRatio = '16:9';
    if (aspectRatio === '9:16' || aspectRatio === '3:4') {
      targetAspectRatio = '9:16';
    }

    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: targetAspectRatio
    };

    // Add lastFrame if provided
    if (endImageBase64) {
      config.lastFrame = {
        imageBytes: stripBase64Prefix(endImageBase64),
        mimeType: getMimeType(endImageBase64)
      };
    }

    let operation = await aiClient.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Animate this scene naturally, cinematic lighting, 4k", 
      image: {
        imageBytes: cleanBase64,
        mimeType: mimeType,
      },
      config: config
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await aiClient.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed: No URI returned.");
    }

    // Need to use the same key for fetching the result
    const keyToUse = apiKey?.trim() || process.env.API_KEY;
    
    // Robustly construct URL with key
    const separator = downloadLink.includes('?') ? '&' : '?';
    const finalUrl = `${downloadLink}${separator}key=${keyToUse}`;

    const videoResponse = await fetch(finalUrl);
    
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText} (${videoResponse.status})`);
    }
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error: any) {
    console.error("Veo Generation Error:", error);
    // Explicitly handle Permission Denied for Billing/Veo
    if (error.status === 403 || error.code === 403 || (error.message && error.message.includes('403'))) {
       throw new Error("Permission Denied (403): Veo requires a PAID Google Cloud API Key with billing enabled. Please set a valid key in the top right corner.");
    }
    throw error;
  }
};