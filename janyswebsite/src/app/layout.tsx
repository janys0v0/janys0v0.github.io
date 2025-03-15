import {NavBar} from "@/components/navbar";
import "@/app/globals.css"; 

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <NavBar />
                <div className="bg-black">
                    {children}
                </div>
            </body>
        </html>
    );
}