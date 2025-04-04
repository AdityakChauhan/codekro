'use client';
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateFilePage() {
  const router = useRouter();
  const [filename, setFilename] = useState("");
  const [language, setLanguage] = useState("javascript");

  const languages = [
    "cpp", "csharp", "go", "java", "javascript", "python", "ruby", "rust", "swift", "typescript"
  ];
  const extensions = ["cpp", "cs", "go", "java", "js", "py", "rb", "rs", "swift", "ts"];
  const handleCreateFile = async () => {
    if (!filename) return alert("Please enter a filename");
    const newFile = { filename, language, userId: 1743417824736 };
    
    await fetch("http://localhost:3001/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFile),
    });
    
    router.push(`/editor?filename=${encodeURIComponent(filename)}&language=${extensions[languages.indexOf(language)]}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-6">Create New File</h2>
        
        <input 
          type="text" 
          placeholder="Enter file name"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
          value={filename} 
          onChange={(e) => setFilename(e.target.value)}
        />
        
        <div className="relative mb-4">
          <select 
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center items-center mb-6">
          <Image src={`/${language}.png`} alt={language} width={50} height={50} />
        </div>
        
        <button 
          onClick={handleCreateFile} 
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          Create File
        </button>
      </div>
    </div>
  );
}
