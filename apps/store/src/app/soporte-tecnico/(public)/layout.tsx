import ChatBotWidget from "../ChatBotWidget";

export default function SoporteTecnicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ChatBotWidget />
    </>
  );
}
