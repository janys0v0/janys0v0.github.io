import { ReactNode } from "react"

export const Section = ({ title, content}: { title: string, content: ReactNode }) => {
    return (
        <div className="container mx-auto py-10" id={title.toLowerCase().replace(/\s+/g, '_')}>
            <h2 className="text-3xl text-white text-left mb-4">{title}</h2>
            <div>{content}</div>
        </div>
    )
}