export const metadata = {
  title: "Flight Deals Finder",
  description: "Find cheap flights quickly",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif', background: '#0b1220', color: '#e6eaf2', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
