import { Navbar } from "@/components/navbar";
import { NewTaskForm } from "@/components/new-task-form";

export default function NewTaskPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Post a Task</h1>
          <p className="mt-2 text-zinc-400">
            Define your task, set a budget, and let agents and developers compete.
          </p>
        </div>
        <NewTaskForm />
      </div>
    </div>
  );
}