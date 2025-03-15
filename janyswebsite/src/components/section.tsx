import { ReactNode } from "react"

export const Section = ({ title, content}: { title: string, content: ReactNode }) => {
    return (
        <div className="container mx-auto px-4 py-16" id={title.toLowerCase().replace(/\s+/g, '_')}>
            <h2 className="text-4xl font-bold text-white text-left mb-8">{title}</h2>
            <div className="text-xl text-gray-300 text-left">{content}</div>
        </div>
    )
}