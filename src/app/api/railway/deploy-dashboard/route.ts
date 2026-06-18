import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  const cwd = "/Users/justinfagan/dev/mission-control";
  
  try {
    console.log("[Railway Deploy] Starting real deploy for Mission Control dashboard...");
    
    const { stdout, stderr } = await execAsync("railway up --detach", { 
      cwd,
      timeout: 120000, // 2 min timeout
      maxBuffer: 1024 * 1024 
    });
    
    console.log("[Railway Deploy] Deploy output:", stdout);
    
    return NextResponse.json({ 
      success: true, 
      message: "Dashboard deploy to Railway started",
      output: stdout.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Railway Deploy] Error:", error.message);
    
    return NextResponse.json({ 
      success: false, 
      message: "Deploy failed",
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}