import ClickableImage from "../components/ClickableImage";
import ClickableCloudinaryImage from "../components/ClickableCloudinaryImage";
import OptimizedProfilePicture from "../components/OptimizedProfilePicture";
import PedigreeCard from "../components/PedigreeCard";
import Pedigree from "../components/Pedigree";
import NewsPost from "../components/NewsPost";
import DogCard from "../components/DogCard";
import NewsPostForm from "../components/NewsPostForm";
import { DogForm } from "../components/DogForm";

function HomePage() {
  const handleDemoClick = (dogId: string) => {
    // For demo purposes, we'll just show an alert since these aren't real dog IDs
    alert(`Demo: Would navigate to /dogs/${dogId} (this is just a demo dog)`);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl justify-center mx-auto">
      <div className="text-3xl font-bold underline text-green-500 w-full">
        Hello World!
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Dog Management Demo</h2>
        <DogForm onSave={(dog) => console.log('Created:', dog)} />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Create News Post</h2>
        <NewsPostForm
          onSubmit={(data) => {
            console.log("News post submitted:", data);
            console.log("Tagged dogs:", data.taggedDogs);
            alert(`News post created successfully! Tagged ${data.taggedDogs?.length || 0} dogs.`);
          }}
          onCancel={() => {
            console.log("Form cancelled");
          }}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">🖼️ Clickable Cloudinary Image Demo</h2>
        <p className="text-gray-600 mb-6">
          Click on any of these images to see them enlarged. The ClickableCloudinaryImage component automatically provides higher quality for the enlarged version.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Example 1: Dog portrait */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Dog Portrait</h3>
            <ClickableCloudinaryImage
              publicId="samples/animals/kitten-playing"
              width={300}
              height={300}
              alt="Adorable kitten playing"
              gravity="face"
              crop="fill"
              quality="auto"
              className="rounded-lg shadow-md"
            />
          </div>

          {/* Example 2: Landscape orientation */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Landscape Image</h3>
            <ClickableCloudinaryImage
              publicId="samples/landscapes/beach-boat"
              width={300}
              height={200}
              alt="Beach with boat"
              gravity="auto"
              crop="fill"
              quality="auto"
              className="rounded-lg shadow-md"
            />
          </div>

          {/* Example 3: Custom enlarged size */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Custom Enlarge Size</h3>
            <ClickableCloudinaryImage
              publicId="samples/food/dessert"
              width={300}
              height={300}
              alt="Delicious dessert"
              enlargedWidth={800}
              enlargedHeight={600}
              gravity="center"
              crop="fill"
              quality="auto"
              className="rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-500">Enlarges to 800x600px</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Usage Example:</h4>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<ClickableCloudinaryImage
  publicId="your-image-id"
  width={300}
  height={300}
  alt="Description"
  gravity="face"
  crop="fill"
  className="rounded-lg"
/>`}
          </pre>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">📰 News Post with Dog Tags Demo</h2>
        <p className="text-gray-600 mb-6">
          Example of a news post featuring tagged kennel dogs
        </p>
        <div className="max-w-xs mx-auto">
          <NewsPost
            imageUrl="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face"
            imageAlt="Golden Retriever Champion"
            date="2024-01-15"
            title="Championship Victory at Regional Show"
            content="Our kennel dogs dominated the regional dog show this weekend, taking home multiple awards including Best in Show. The competition was fierce but our training paid off."
            taggedDogs={["sample-dog-1", "sample-dog-2"]} // These would be real dog IDs in production
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">🐕 Advanced Dog Image Fitting - Cloudinary Enhanced</h2>
        <p className="text-gray-600 mb-6">
          Based on <a href="https://cloudinary.com/documentation/image_transformations#landingpage" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Cloudinary's advanced transformations</a>, 
          these modes are specifically optimized for fitting dog pictures perfectly onto cards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Smart Thumbnail - Best for dog cards! */}
          <DogCard
            name="Smart Thumbnail ⭐"
            breed="AI-Powered Best Fit"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            imageAlt="Smart thumbnail mode"
            fallbackInitials="ST"
            subtitle="🎯 AI detects faces & subjects automatically"
          />

          {/* Enhanced Auto-Focus */}
          <DogCard
            name="Auto-Subject Focus"
            breed="Enhanced Detection"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto:subject"
            imageAlt="Auto-subject focus mode"
            fallbackInitials="AS"
            subtitle="🔍 Enhanced subject detection"
          />

          {/* Body Detection for full dog photos */}
          <DogCard
            name="Body Detection"
            breed="Full Dog Focus"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="body"
            imageAlt="Body detection mode"
            fallbackInitials="BD"
            subtitle="🐕 Focuses on entire dog body"
          />

          {/* Enhanced with automatic improvements */}
          <DogCard
            name="Enhanced + Auto-Improve"
            breed="Quality Boost"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            imageEnhance={true}
            imageAlt="Enhanced with auto-improve"
            fallbackInitials="EA"
            subtitle="✨ AI enhancement + smart cropping"
          />

          {/* Advanced Face Detection */}
          <DogCard
            name="Advanced Faces"
            breed="Multiple Face Detection"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="faces"
            imageAlt="Advanced face detection"
            fallbackInitials="AF"
            subtitle="👥 Detects multiple faces/subjects"
          />

          {/* Comparison: Basic vs Smart */}
          <DogCard
            name="Basic Fill"
            breed="Standard Crop"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="center"
            imageAlt="Basic fill mode"
            fallbackInitials="BF"
            subtitle="📐 Simple center crop (for comparison)"
          />
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🏆 Recommended for Dog Cards:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li><strong>Fill + Auto Gravity:</strong> Best overall choice - automatically detects and focuses on the most important parts</li>
            <li><strong>Body Detection:</strong> Perfect for full-body dog photos where you want to show the entire dog</li>
            <li><strong>Enhanced + Auto-Improve:</strong> Adds AI-powered quality improvements for older or lower-quality photos</li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">⚡ React Performance Features</h2>
        <p className="text-gray-600 mb-6">
          Based on <a href="https://cloudinary.com/documentation/react_image_transformations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Cloudinary's React plugins</a>, 
          these features optimize loading performance and user experience.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Lazy Loading Demo */}
          <DogCard
            name="Lazy Loading ⚡"
            breed="Performance Optimized"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            enableLazyLoading={true}
            enablePlaceholder={false}
            imageAlt="Lazy loading demo"
            fallbackInitials="LL"
            subtitle="🚀 Loads only when visible"
          />

          {/* Blur Placeholder Demo */}
          <DogCard
            name="Blur Placeholder"
            breed="Smooth Loading"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            enableLazyLoading={true}
            enablePlaceholder={true}
            placeholderType="blur"
            imageAlt="Blur placeholder demo"
            fallbackInitials="BP"
            subtitle="🌟 Blurred preview while loading"
          />

          {/* Pixelate Placeholder Demo */}
          <DogCard
            name="Pixelate Placeholder"
            breed="Retro Style"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            enableLazyLoading={true}
            enablePlaceholder={true}
            placeholderType="pixelate"
            imageAlt="Pixelate placeholder demo"
            fallbackInitials="PP"
            subtitle="🎮 Pixelated preview effect"
          />

          {/* Responsive Images Demo */}
          <DogCard
            name="Responsive Images"
            breed="Smart Sizing"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            enableLazyLoading={true}
            enablePlaceholder={true}
            responsiveStepSize={100}
            imageAlt="Responsive images demo"
            fallbackInitials="RI"
            subtitle="📱 Adapts to screen size"
          />

          {/* Accessibility Demo */}
          <DogCard
            name="Accessibility Mode"
            breed="Vision Assistance"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            enableLazyLoading={true}
            enablePlaceholder={true}
            enableAccessibility={true}
            accessibilityMode="colorblind"
            imageAlt="Accessibility demo"
            fallbackInitials="AM"
            subtitle="♿ Enhanced for colorblind users"
          />

          {/* All Features Combined */}
          <DogCard
            name="Full Featured ⭐"
            breed="Everything Enabled"
            imagePublicId="dog_images/DK03226_2025_profile_1756131662097"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            imageEnhance={true}
            enableLazyLoading={true}
            enablePlaceholder={true}
            placeholderType="blur"
            responsiveStepSize={150}
            imageAlt="Full featured demo"
            fallbackInitials="FF"
            subtitle="🎯 All optimizations enabled"
          />
        </div>
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">🚀 Performance Benefits:</h3>
          <ul className="text-green-800 text-sm space-y-1">
            <li><strong>Lazy Loading:</strong> Images load only when needed, improving initial page load</li>
            <li><strong>Placeholders:</strong> Prevent layout shifts and provide instant visual feedback</li>
            <li><strong>Responsive Images:</strong> Automatically deliver the right size for each device</li>
            <li><strong>Accessibility:</strong> Support users with visual impairments</li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Regular Demo Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <DogCard
            name="Champion Golden Thunder"
            breed="Golden Retriever"
            imageUrl="https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&crop=face"
            imageAlt="Golden Retriever Champion"
            fallbackInitials="GT"
            dogId="demo-1"
            onDogClick={handleDemoClick}
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
          
          {/* Example using Cloudinary sample image */}
          <DogCard
            name="Cloudinary Sample"
            breed="Demo Image" 
            imagePublicId="sample"
            imageSize={266}
            imageCrop="fill"
            imageGravity="auto"
            imageAlt="Cloudinary Sample Image"
            fallbackInitials="CS"
            subtitle="Default sample image"
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
      </div>
    </div>
  );
}

export default HomePage;
