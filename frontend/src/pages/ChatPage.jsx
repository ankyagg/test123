// src/pages/ChatPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import Chat from "./Chat";

export default function ChatPage() {
  const { mentorId } = useParams();
  const userName = localStorage.getItem("name") || "Student";

  if (!mentorId) return <p>No mentor selected.</p>;

  return <Chat roomId={mentorId} userName={userName} />;
}
