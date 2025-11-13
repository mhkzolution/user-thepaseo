"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import RichTextEditor from "@/components/RichTextEditor/page";

interface HelpTerms {
  id: string;
  description: string;
}

export default function HelpTerms() {
  const [term, setTerm] = useState<HelpTerms>({ id: "", description: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch HelpTerms on mount
  useEffect(() => {
    const fetchTerm = async () => {
      try {
        const response = await axios.get("/api/admin/help/helpterms");
        setTerm(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch terms");
        setLoading(false);
      }
    };
    fetchTerm();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put("/api/admin/help/helpterms", {
        id: term.id,
        description: term.description,
      });
      setIsEditing(false);
      alert("Terms updated successfully");
    } catch (error) {
      setError("Failed to update terms");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="bg-white p-10 rounded-lg flex-1 mr-4">
      <h1 className="text-2xl font-bold mb-4">ติดต่อเจ้าหน้าที่</h1>
      <div className="flex flex-row justify-between mb-4">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Terms Description
              </label>
              <RichTextEditor
                value={term.description || ""}
                onChange={(value: string) => setTerm({ ...term, description: value })}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-paseo text-white rounded-lg hover:bg-paseo-hover disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-paseo text-white rounded-lg hover:bg-paseo-hover disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-2">Current Terms</h2>
            <div
              className="text-gray-700 mb-4 prose"
              dangerouslySetInnerHTML={{ __html: term.description || "No terms defined" }}
            />
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-paseo text-white rounded-lg hover:bg-paseo-hover disabled:opacity-50"
            >
              Edit Terms
            </button>
          </div>
        )}
      </div>
    </div>
  );
}