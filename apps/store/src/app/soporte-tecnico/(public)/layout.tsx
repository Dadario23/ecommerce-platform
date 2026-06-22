import SoporteNavbar from "@/components/SoporteNavbar";
import ChatBotWidget from "../ChatBotWidget";

export default function SoporteTecnicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SoporteNavbar />
      {children}
      <ChatBotWidget />
    </>
  );
}
