import { Section } from "@/components/section";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-white text-center mb-5">About Me</h1>
        <hr className="w-1/3 border-t border-gray-300 mb-8 mx-auto" />
        
        <div className="flex flex-col md:flex-row gap-8 mb-16">
          <div className="md:w-1/3">
            <div className="rounded-lg overflow-hidden">
              <img 
                src="/nextjs-github-pages/dog_pic.jpg" 
                alt="Janys Li" 
                className="w-3/4 h-auto object-cover rounded-lg"
              />
            </div>
          </div>
          
          <div className="md:w-2/3">
            <Section 
              title="Who I Am" 
              content={
                <p>
                  Hi! I'm Janys (Jiayang) Li, a student at UCLA studying Statistics and Cognitive Science. 
                  I'm passionate about leveraging creative technologies to answer interesting questions, 
                  from discovering business insights to understanding emotional flexibility.
                </p>
              } 
            />
            
            <Section 
              title="My Journey" 
              content={
                <p>
                  My academic journey combines the analytical rigor of statistics with the 
                  fascinating world of cognitive science. This interdisciplinary approach allows me 
                  to tackle problems from multiple perspectives, bringing both data-driven insights 
                  and human-centered thinking to my work.
                </p>
              } 
            />
            
            <Section 
              title="What I Do" 
              content={
                <p>
                  I work at the intersection of data science and human behavior, developing solutions 
                  that are both technically sound and user-friendly. Whether it's building LLM pipelines 
                  for business use cases or conducting user experience research, I'm always looking for 
                  ways to make technology more accessible and impactful.
                </p>
              } 
            />

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
        </div>
        
        
      </div>
    </main>
  );
}
