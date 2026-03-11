import { GoogleGenAI } from "@google/genai";
import { LoanDetail } from "../lib/utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getLoanInsights(loan: LoanDetail) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this loan and provide 3 short, actionable financial tips to save interest or pay it off faster. 
      Loan Name: ${loan.name}
      Amount: ${loan.amount}
      Interest Rate: ${loan.interest_rate}%
      Tenure: ${loan.tenure_months} months
      EMI: ${loan.emi}
      
      Return the response as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Insight Error:", error);
    return [
      "Consider rounding up your EMI to the nearest thousand to save significant interest over time.",
      "Making one extra EMI payment every year can reduce your tenure by several months.",
      "Monitor market interest rates; if they drop by more than 1%, consider refinancing."
    ];
  }
}
