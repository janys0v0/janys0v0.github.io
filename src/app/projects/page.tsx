'use client'

import { Project} from "@/components/project"
import { Section } from "@/components/section"
export default function ProjectsPage() {
    return (
        <main>
            <div className="container mx-auto px-4 py-16">
                <h1 className="text-5xl font-bold text-white text-center mb-5">Projects</h1>
                <hr className="w-1/3 border-t border-gray-300 mb-8 mx-auto" />
            </div>
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-1 gap-8 mb-16">
                <Project title="Gymnastics Olympics Team Selection"
                subtitle="UCSAS 2024"
                description="explore and understand AI-generated art through a minimalist implementation of diffusion models." 
                image_url="/proj1_photo.jpg" 
                link = "https://github.com/janys0v0/UCSAS_Wailian_Submission" />
                
                <Project title="Logo Generation with Diffusion Models" 
                subtitle="PIC 16B"
                description="Generate a logo for a given company name using U-Net." image_url="/proj2_img.png"
                link = "https://github.com/janys0v0/logo-generation" />
            </div>

            <p className="text-4xl font-bold text-white text-center mb-5">Want to Learn More?</p>
            <a 
                    href="/projects" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mx-auto flex justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 w-50 rounded-full transition-colors mb-50"
                  >
                  Visit My Projects
                  </a>
        </main>
    )
}