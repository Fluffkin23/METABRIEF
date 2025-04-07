"use client";

import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// Define the structure of the form input data
type FormInput = {
    repoUrl: string; // URL of the GitHub repository
    projectName: string; // Name of the project
    githubToken?: string; // Optional GitHub token for authentication
}

// Function to handle form submission
function onSubmit(data: FormInput) {
    // Alert the user with the submitted data
    window.alert(data);
    return true; // Indicate successful submission
}

// Main component for creating a new project
const CreatePage = () => {
    // Initialize the form handling methods from react-hook-form
    const { register, handleSubmit, reset } = useForm<FormInput>();

    return (
        <div className="flex items-center gap-12 h-full justify-center">
            <img src="/undraw_github.svg" className="h-56 w-auto" /> {/* Image for visual context */}
            <div>
                <div>
                    <h1 className="font-semibold text-2xl">Link your repository</h1> {/* Main heading */}
                    <p className="text-sm text-muted-foreground"> Enter the URL of your GitHub repository to get started.</p> {/* Instructional text */}
                </div>
                <div className="h-4"></div> {/* Spacer */}
                <div>
                    {/* Form for user input */}
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* Input for project name, required field */}
                        <Input  {...register("projectName", { required: true })} placeholder="Project Name" required />
                        <div className="h-2"></div> {/* Spacer */}
                        {/* Input for repository URL, required field */}
                        <Input  {...register("repoUrl", { required: true })} placeholder="Repository URL" required />
                        <div className="h-2"></div> {/* Spacer */}
                        {/* Input for optional GitHub token */}
                        <Input  {...register("githubToken")} placeholder="Repository Token (Optional)" />
                        <div className="h-4"></div> {/* Spacer */}
                        {/* Button to submit the form */}
                        <Button>Create Project</Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreatePage; // Export the CreatePage component for use in other parts of the application