export default function ResumePage() {
    return (
        <main>
            <div className="container mx-auto px-4 py-16">
                <h1 className="text-5xl font-bold text-white text-center mb-5">Resume</h1>
                <hr className="w-1/3 border-t border-gray-300 mb-8 mx-auto" />
            </div>
            <div className="container mx-auto px-4 pb-16">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <iframe 
                        src="/Jiayang Li Resume.pdf" 
                        className="w-full h-screen"
                        title="Jiayang Li Resume"
                    />
                </div>
            </div>
        </main>
    );
}