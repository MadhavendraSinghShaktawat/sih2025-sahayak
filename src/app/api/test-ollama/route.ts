import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "tinyllama";
    
    console.log("Testing Ollama connection:", { ollamaUrl, ollamaModel });

    // Test 1: Check if Ollama is running
    const tagsResponse = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!tagsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Ollama not responding: ${tagsResponse.status} ${tagsResponse.statusText}`,
        ollamaUrl,
        ollamaModel,
      }, { status: 500 });
    }

    const tagsData = await tagsResponse.json();
    console.log("Available models:", tagsData.models?.map((m: any) => m.name));

    // Test 2: Check if our model exists
    const hasOurModel = tagsData.models?.some((model: any) => model.name === ollamaModel);
    
    if (!hasOurModel) {
      return NextResponse.json({
        success: false,
        error: `Model '${ollamaModel}' not found`,
        availableModels: tagsData.models?.map((m: any) => m.name) || [],
        ollamaUrl,
        ollamaModel,
      }, { status: 404 });
    }

    // Test 3: Try a simple generation
    const generateResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: "Hello",
        stream: false,
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      return NextResponse.json({
        success: false,
        error: `Generation failed: ${generateResponse.status} ${generateResponse.statusText} - ${errorText}`,
        ollamaUrl,
        ollamaModel,
      }, { status: 500 });
    }

    const generateData = await generateResponse.json();

    return NextResponse.json({
      success: true,
      message: "Ollama is working correctly",
      ollamaUrl,
      ollamaModel,
      availableModels: tagsData.models?.map((m: any) => m.name) || [],
      testResponse: generateData.response,
    });

  } catch (error) {
    console.error("Ollama test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
      ollamaModel: process.env.OLLAMA_MODEL || "tinyllama",
    }, { status: 500 });
  }
}
