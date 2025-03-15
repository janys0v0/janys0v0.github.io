export function Project({title, subtitle, description, image_url, link}: {title: string, subtitle: string, description: string, image_url: string, link: string}) {
    return (
                <div className="relative rounded-lg overflow-hidden shadow-lg w-full h-full ml-10">
                    <img src={image_url} alt="A gymnastics photo" className="w-full h-full object-cover" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-700 bg-opacity-20 flex flex-col justify-center p-6">
                        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
                        <h3 className="font-mono text-xl text-white mb-4">{subtitle}</h3>
                        <p className="text-gray-200 font-mono ">
                            {description}
                        </p>
                        <a 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors w-40 mt-4 text-center"
                  >View Project</a>
                    </div>
                </div>
    )
}