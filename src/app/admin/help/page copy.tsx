'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import RichTextEditor from "@/components/RichTextEditor/page";

interface Help {
  id: string;
  type: string;
  question: string;
  answer: string;
  isActive: boolean;
}

export default function AdminHelpPage() {
  const [helps, setHelps] = useState<Help[]>([]);
  const [form, setForm] = useState({
    type: "FAQ",
    question: "",
    answer: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchHelps = async () => {
    const res = await fetch("/api/admin/help");
    setHelps(await res.json());
  };

  useEffect(() => {
    fetchHelps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await fetch(`/api/admin/help/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditingId(null);
    } else {
      await fetch("/api/admin/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ type: "FAQ", question: "", answer: "", isActive: true });
    fetchHelps();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบข้อมูลนี้?")) return;
    await fetch(`/api/admin/help/${id}`, { method: "DELETE" });
    fetchHelps();
  };

  const handleEdit = (help: Help) => {
    setForm({
      type: help.type,
      question: help.question,
      answer: help.answer,
      isActive: help.isActive,
    });
    setEditingId(help.id);
  };

  return (
    <div className="bg-white md:p-10 p-4 space-y-4 rounded-lg flex-1 mr-4">
      <h1 className="text-xl font-bold mb-4">Admin Help / FAQ</h1>

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <Select
          value={form.type}
          onValueChange={(v) => setForm({ ...form, type: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="ประเภท Help" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="FAQ">FAQ</SelectItem>
            <SelectItem value="QA">Q/A</SelectItem>
            <SelectItem value="CONTACT">Contact</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="คำถาม"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
        <RichTextEditor
          value={form.answer}
          onChange={(value: string) => {
            setForm({ ...form, answer: value });
          }}
        />

        <Button type="submit" className="text-white p-3 rounded-lg bg-paseo hover:bg-paseo-hover">
          {editingId ? "บันทึกการแก้ไข" : "เพิ่ม Help"}
        </Button>
      </form>

      {/* Tabs */}
      <Tabs defaultValue="FAQ" className="w-full">
        <TabsList className="mb-4 flex space-x-2 bg-muted p-1 rounded-xl gap-4">
          <TabsTrigger
            value="FAQ"
            className="rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 hover:bg-paseo-hover hover:text-white aria-selected:bg-paseo aria-selected:text-white shadow"
          >
            FAQ
          </TabsTrigger>
          <TabsTrigger
            value="QA"
            className="rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 hover:bg-paseo-hover hover:text-white aria-selected:bg-paseo aria-selected:text-white shadow"
          >
            Q/A
          </TabsTrigger>
          <TabsTrigger
            value="CONTACT"
            className="rounded-lg px-4 py-2 transition-all duration-200 text-gray-700 hover:bg-paseo-hover hover:text-white aria-selected:bg-paseo aria-selected:text-white shadow"
          >
            Contact
          </TabsTrigger>
        </TabsList>

        {["FAQ", "QA", "CONTACT"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="flex flex-col gap-2">
              {helps
                .filter((h) => h.type === tab)
                .map((h) => (
                  <div
                    key={h.id}
                    className="border p-2 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">{h.question}</p>
                      <div
                        className="prose text-base mb-2 prose-ol:list-decimal prose-ol:pl-6 prose-ul:list-disc prose-ul:pl-6"
                        dangerouslySetInnerHTML={{ __html: h.answer || "<p>ยังไม่มีรายละเอียด...</p>" }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleEdit(h)} className="bg-paseo text-white">
                        แก้ไข
                      </Button>
                      <Button
                        className="bg-red-500 text-white"
                        variant="destructive"
                        onClick={() => handleDelete(h.id)}
                      >
                        ลบ
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}