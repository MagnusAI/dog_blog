import "./config/imageConfig"; // Initialize image service
import ClickableImage from "./components/ClickableImage";
import OptimizedProfilePicture from "./components/OptimizedProfilePicture";
import PedigreeCard from "./components/PedigreeCard";
import Pedigree from "./components/Pedigree";
import NewsPost from "./components/NewsPost";
import HighlightedNewsPost from "./components/HighlightedNewsPost";
import AppBar from "./components/ui/AppBar";
import Button from "./components/ui/Button";
import DogCard from "./components/DogCard";
import NewsPostForm from "./components/NewsPostForm";
import { DogForm } from "./components/DogForm";

function App() {
  const navigationLinks = [
    { label: "Home", onClick: () => console.log("Home clicked") },
    { label: "Pedigrees", onClick: () => console.log("Pedigrees clicked") },
    { label: "News", onClick: () => console.log("News clicked") },
    { label: "About", onClick: () => console.log("About clicked") }
  ];

  const loginButton = (
    <Button variant="primary" size="sm">
      Login
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar
        links={navigationLinks}
        actionItem={loginButton}
        onLogoClick={() => console.log("Logo clicked")}
      />
      
      <div className="p-8 space-y-8">
        <div className="text-3xl font-bold underline text-green-500 w-full">
          Hello World!
        </div>
        <DogForm onSave={(dog) => console.log('Created:', dog)} />


        <div>
          <h2 className="text-xl font-bold mb-4">Create News Post</h2>
          <NewsPostForm
            onSubmit={(data) => {
              console.log("News post submitted:", data);
              alert("News post created successfully!");
            }}
            onCancel={() => {
              console.log("Form cancelled");
            }}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Kennel Dogs Grid</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <DogCard
              name="Champion Golden Thunder"
              breed="Golden Retriever"
              imageUrl="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face"
              imageAlt="Golden Retriever Champion"
              fallbackInitials="GT"
            />
            
            <DogCard
              name="Sunnybrook's Belle"
              breed="Golden Retriever"
              imageUrl="https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face"
              imageAlt="Golden Retriever Female"
              fallbackInitials="SB"
            />
            
            <DogCard
              name="Rocky Mountain High"
              breed="Golden Retriever"
              imageUrl="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop&crop=face"
              imageAlt="Golden Retriever Male"
              fallbackInitials="RM"
            />
            
            <DogCard
              name="Meadowlark's Promise"
              breed="Golden Retriever"
              fallbackInitials="MP"
            />
          </div>
        </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Pedigree Cards</h2>
          <div className="space-y-4">
            {/* Small size card */}
            <PedigreeCard
              imageUrl="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=200&h=200&fit=crop&crop=face"
              imageAlt="Golden Retriever"
              relation="Father"
              regnr="AKC-123456789"
              name="Champion Golden Thunder of Sunnybrook"
              titles={["CH", "GRCH", "OTCH", "UDX", "CGC"]}
              fallbackInitials="GT"
            />
            
            {/* Medium size card */}
            <PedigreeCard
              imageUrl="https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face"
              imageAlt="Golden Retriever"
              relation="Mother"
              regnr="AKC-987654321"
              name="Sunnybrook's Golden Belle Supreme"
              titles={["CH", "GRCH", "TD", "WC", "CGC", "TKN"]}
              fallbackInitials="GB"
            />
            
            {/* Large size card */}
            <PedigreeCard
              imageUrl="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop&crop=face"
              imageAlt="Golden Retriever"
              relation="Paternal Grandfather"
              regnr="AKC-456789123"
              name="Legendary Sunnybrook King of Hearts"
              titles={["GRCH", "OTCH", "UDX", "WCX", "MH", "CGC", "TKA"]}
              fallbackInitials="LK"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Pedigree Tree (with PedigreeCard components)</h2>
          <div className="overflow-x-auto">
            <Pedigree />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Pure ClickableImage (with any URL)</h2>
          <ClickableImage
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
            alt="Sample User"
            size="lg"
            fallbackInitials="SU"
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Optimized ProfilePicture (with Cloudinary React SDK)</h2>
          <div className="flex gap-4 items-center">
            <OptimizedProfilePicture
              publicId="sample" // This is a demo image available in all Cloudinary accounts
              alt="Cloudinary Sample"
              size="xxl"
              fallbackInitials="CS"
            />
            
            <OptimizedProfilePicture
              publicId="sample"
              alt="Cloudinary Sample Grayscale"
              size="lg"
              fallbackInitials="CS"
              transformations={["e_grayscale"]} // Make it grayscale
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Featured News (Highlighted)</h2>
          <HighlightedNewsPost
            imageUrl="https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop&auto=format&q=80"
            imageAlt="Championship dog show arena"
            date="2025-01-20"
            title="Breaking: Historic Win at International Championship Sets New Standards"
            excerpt="In an unprecedented display of excellence, this year's international championship has redefined what it means to achieve perfection in pedigree competitions. With over 500 participants from 30 countries, the event showcased the pinnacle of breeding excellence and training dedication that has shaped the future of canine sports."
            dateFormat="long"
            backgroundColor="transparent"
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">News Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Small news post */}
            <NewsPost
              imageUrl="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80"
              imageAlt="Dog championship event"
              date="2025-01-15"
              title="Annual Dog Show Championship Results"
              excerpt="The 2025 National Dog Show concluded with record-breaking attendance and fierce competition across all breeds. Golden Retrievers dominated the sporting group with exceptional performances."
              size="sm"
              dateFormat="short"
            />

            {/* Medium news post */}
            <NewsPost
              imageUrl="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&auto=format&q=80"
              imageAlt="Dog training session"
              date="2025-01-10"
              title="New Training Techniques for Better Pedigree Performance"
              excerpt="Discover the latest methodologies in canine training that are revolutionizing how we prepare dogs for competitions. Expert trainers share their insights on building stronger bonds between handlers and their champions."
              size="md"
              dateFormat="relative"
            />

            {/* Large news post */}
            <NewsPost
              imageUrl="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop&auto=format&q=80"
              imageAlt="Veterinary care for dogs"
              date="2025-01-05"
              title="Health and Wellness: Maintaining Champion Bloodlines"
              excerpt="A comprehensive guide to ensuring the health and vitality of pedigreed dogs. From nutrition to genetic testing, learn how top breeders maintain the integrity of their bloodlines while promoting overall canine wellness and longevity."
              size="lg"
              dateFormat="long"
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default App;
