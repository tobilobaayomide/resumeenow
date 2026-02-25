import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useResumes } from "../hooks/useResumes";
import DashboardView from "../components/dashboard/DashboardView";

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    resumes,
    loading: resumesLoading,
    deleteResume,
    refreshResumes // Added this function from hook
  } = useResumes(user?.id);

  const username =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    "User";

  const [newTitle, setNewTitle] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [user, authLoading, navigate]);

  // REFRESH DATA ON MOUNT / FOCUS
  // This ensures that when you come back from Builder, the list is fresh.
  useEffect(() => {
    if (user && refreshResumes) {
        refreshResumes();
    }
  }, [user, refreshResumes]); // refreshResumes is stable now thanks to useCallback

  // Just go to /builder/new with the template ID
  const handleCreateResume = (templateId: string) => {
    const titleParam = newTitle.trim() ? `&title=${encodeURIComponent(newTitle.trim())}` : '';
    navigate(`/builder/new?template=${templateId}${titleParam}`);
    setNewTitle("");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const handleDeleteResume = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      await deleteResume(id);
    }
  };

  const handleUploadResume = async (file: File) => {
    alert(`Uploaded file: ${file.name}`);
  };

  if (authLoading) return null;

  return (
    <DashboardView
      userEmail={user?.email}
      resumes={resumes}
      isLoading={resumesLoading}
      newTitle={newTitle}
      isCreating={false} 
      onTitleChange={handleTitleChange}
      onCreateResume={handleCreateResume}
      onDeleteResume={handleDeleteResume}
      onUploadResume={handleUploadResume}
      username={username}
    />
  );
};

export default Dashboard;