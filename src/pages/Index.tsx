import { Navbar } from "@/components/layout/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to anoniverse</h1>
          <p className="text-gray-600 mt-2">
            A place for anonymous discussions. Explore communities and share your thoughts freely.
          </p>
        </header>
        <div className="grid gap-6">
          {/* You can add featured communities or posts here */}
          <p>No featured content yet. Start exploring or create a post!</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
