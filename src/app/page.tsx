import {BannerBackground} from "@/components/BannerBackground";
import { Section } from "@/components/section";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-900">
      <div className="flex-1">
        
        <BannerBackground>
          <div className="container mx-auto px-8 md:px-16 py-36 flex flex-col items-center justify-start h-full">
            <div className="flex flex-col md:flex-row items-center justify-between w-full">
              <div className="md:w-1/2">
                <h1 className="text-6xl font-bold text-white text-center md:text-left mb-4 mt-16">Hi! I'm Janys (Jiayang) Li :P</h1>
                <hr className="w-1/3 border-t border-gray-300 mb-8" />
                <p className="text-xl text-gray-300 text-center md:text-left font-mono">Stats & Cogsci @ UCLA</p>
                <p className="text-[#6699cc] text-center md:text-left font-mono">Hi! I am <text className="text-yellow-500">Janys</text>. I leverage <text className="text-pink-400">creative technologies</text> to answer interesting questions, from discovering business insights to understanding emotional flexibility.</p>
              </div>
              <div className="md:w-1/2 flex justify-center md:justify-end mt-6 md:mt-0">
                <div className="w-64 h-64 overflow-hidden border-4 border-white rounded-lg">
                <Image 
                  src="/nextjs-github-pages/profile_pic.jpeg" 
                  alt="Janys Li" 
                  width={256} 
                  height={256} 
                  className="w-64 h-64 object-cover"
                />
                </div>
              </div>
            </div>
            <div className="h-16"></div>


            <Section title="My Skills" content={
              <ul className="list-disc pl-5 space-y-2">
                <li className="text-gray-300">Programming: Python, R, SQL, C++, HTML, CSS</li>
                <li className="text-gray-300">Data Processing & Visualization: Excel, Databricks, Tableau, Power BI</li>
                <li className="text-gray-300">Machine Learning: PyTorch, TensorFlow</li>
                <li className="text-gray-300">User Experience: Figma, A/B Testing</li>
              </ul>
            } />

            <Section title="My Projects" content={
              <div>
                <p>
                  I have worked on a variety of projects, from understanding user experiences to building LLM pipelines for business use cases.
                </p>
                <br></br>
                  <a 
                    href="https://github.com/janys0v0" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
                  >
                  Visit My GitHub
                  </a>
              </div>
            } />

<Section 
          title="Get In Touch" 
          content={
            <div>
              <p className="mb-4">
                I'm always open to new opportunities, collaborations, or just a friendly chat about 
                technology and its applications.
              </p>
              <br></br>
              <p><b>My Email: </b>
                <a href="mailto:jli25@g.ucla.edu" className="text-blue-500 hover:text-blue-700">jli25@g.ucla.edu</a>
              </p>
              <div className="mt-4">
                <a 
                  href="https://www.linkedin.com/in/jiayang-li" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
                >
                  Connect on LinkedIn
                </a>
              </div>
              </div>
          } 
        />

          </div>
        </BannerBackground>
      </div>
    </main>
  );
}
