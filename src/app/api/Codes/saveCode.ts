import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

const filePath = path.join(process.cwd(), "db.json");

const LANGUAGE_CONFIG = {
  javascript: { id: "javascript", pistonRuntime: { language: "javascript", version: "18.15.0" } },
  typescript: { id: "typescript", pistonRuntime: { language: "typescript", version: "5.0.3" } },
  python: { id: "python", pistonRuntime: { language: "python", version: "3.10.0" } },
  java: { id: "java", pistonRuntime: { language: "java", version: "15.0.2" } },
  go: { id: "go", pistonRuntime: { language: "go", version: "1.16.2" } },
  rust: { id: "rust", pistonRuntime: { language: "rust", version: "1.68.2" } },
  cpp: { id: "cpp", pistonRuntime: { language: "cpp", version: "10.2.0" } },
  csharp: { id: "csharp", pistonRuntime: { language: "csharp", version: "6.12.0" } },
  ruby: { id: "ruby", pistonRuntime: { language: "ruby", version: "3.0.1" } },
  swift: { id: "swift", pistonRuntime: { language: "swift", version: "5.3.3" } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { filename, language, code } = req.body;
      
      if (!LANGUAGE_CONFIG[language]) {
        return res.status(400).json({ message: "Unsupported language." });
      }
      
      const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ content: code }],
        }),
      });
      const result = await response.json();

      const existingData = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
        : {};

      existingData[filename] = { language, code, lastUpdated: new Date().toISOString(), output: result.run?.output || "" };
      
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
      res.status(200).json({ message: "Code saved and executed successfully.", output: result.run?.output });
    } catch (error) {
      res.status(500).json({ message: "Failed to save or execute code." });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
