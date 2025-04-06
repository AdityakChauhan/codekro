"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserFilesPage() {
  interface File {
    id: string;
    filename: string;
    language: string;
  }

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (!storedId) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:3001/files?userId=${storedId}`)
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching files:", err);
        setLoading(false);
      });
  }, []);

  const getFileIcon = (language: string) => {
    const availableIcons = ["cpp", "csharp", "go", "java", "javascript", "python", "ruby", "rust", "swift", "typescript"];
    return availableIcons.includes(language.toLowerCase()) ? `/${language.toLowerCase()}.png` : "/default.png";
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/files/${id}`, {
        method: "DELETE",
      });
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Files</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition"
        >
          Logout
        </button>
      </div>

      <button
        className="mb-6 px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition"
        onClick={() => router.push("/create")}
      >
        + Create New File
      </button>

      {loading ? (
        <p className="text-gray-400">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-gray-400">No files found. Create a new file to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-gray-800 p-5 rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:bg-gray-700 transition hover:shadow-lg"
            >
              <div
                className="flex items-center"
                onClick={() =>
                  router.push(
                    `/editor?filename=${encodeURIComponent(file.filename)}&language=${encodeURIComponent(file.language)}`
                  )
                }
              >
                <Image
                  src={getFileIcon(file.language)}
                  alt={file.language}
                  width={50}
                  height={50}
                  className="mr-4"
                />
                <div>
                  <h3 className="text-lg font-semibold">{file.filename}</h3>
                  <p className="text-gray-400 text-sm">{file.language}</p>
                </div>
              </div>

              <button
                className="ml-4 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.id);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
