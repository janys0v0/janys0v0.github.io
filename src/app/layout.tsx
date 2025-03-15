import {NavBar} from "@/components/navbar";
import {BannerBackground} from "@/components/BannerBackground";
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
                <BannerBackground>
                        {children}
                </BannerBackground>
            </body>
        </html>
    );
}