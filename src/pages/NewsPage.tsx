import NewsPost from '../components/NewsPost';
import HighlightedNewsPost from '../components/HighlightedNewsPost';

function NewsPage() {
  // Mock news posts data - in a real app, this would come from your database/API
  const featuredPost = {
    imageUrl: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop&auto=format&q=80",
    imageAlt: "Championship dog show arena",
    date: "2025-01-20",
    title: "Breaking: Historic Win at International Championship Sets New Standards",
    excerpt: "In an unprecedented display of excellence, this year's international championship has redefined what it means to achieve perfection in pedigree competitions. With over 500 participants from 30 countries, the event showcased the pinnacle of breeding excellence and training dedication that has shaped the future of canine sports."
  };

  const newsPosts = [
    {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Dog championship event",
      date: "2025-01-15",
      title: "Annual Dog Show Championship Results",
      excerpt: "The 2025 National Dog Show concluded with record-breaking attendance and fierce competition across all breeds. Golden Retrievers dominated the sporting group with exceptional performances."
    },
    {
      id: 2,
      imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Dog training session",
      date: "2025-01-10",
      title: "New Training Techniques for Better Pedigree Performance",
      excerpt: "Discover the latest methodologies in canine training that are revolutionizing how we prepare dogs for competitions. Expert trainers share their insights on building stronger bonds between handlers and their champions."
    },
    {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Veterinary care for dogs",
      date: "2025-01-05",
      title: "Health and Wellness: Maintaining Champion Bloodlines",
      excerpt: "A comprehensive guide to ensuring the health and vitality of pedigreed dogs. From nutrition to genetic testing, learn how top breeders maintain the integrity of their bloodlines while promoting overall canine wellness and longevity."
    },
    {
      id: 4,
      imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Golden Retriever puppy",
      date: "2025-01-01",
      title: "New Year, New Litter: Welcoming Champion Bloodlines",
      excerpt: "Starting the year with exciting news as our champion female has delivered a healthy litter of eight puppies. Each puppy shows promising traits that continue our kennel's legacy of excellence."
    },
    {
      id: 5,
      imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Dog agility competition",
      date: "2024-12-28",
      title: "Winter Agility Series Kicks Off with Record Participation",
      excerpt: "The winter agility series has begun with unprecedented enthusiasm from handlers and their dogs. This year's course designs challenge both speed and precision, testing the true partnership between dog and handler."
    },
    {
      id: 6,
      imageUrl: "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Dog grooming",
      date: "2024-12-25",
      title: "Holiday Grooming Tips for Show Dogs",
      excerpt: "During the holiday season, maintaining your show dog's coat and appearance becomes even more important. Our expert groomers share their top tips for keeping your dog looking championship-ready through the festive period."
    },
    {
      id: 7,
      imageUrl: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Dog nutrition",
      date: "2024-12-20",
      title: "Nutrition Science: Feeding for Peak Performance",
      excerpt: "Modern canine nutrition has evolved significantly, with new research revealing optimal feeding strategies for performance dogs. Learn about the latest developments in nutritional science that are helping dogs reach their full potential."
    },
    {
      id: 8,
      imageUrl: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=300&fit=crop&auto=format&q=80",
      imageAlt: "Kennel facilities",
      date: "2024-12-15",
      title: "Kennel Expansion Complete: New Facilities Tour",
      excerpt: "After months of construction, our kennel expansion is finally complete. The new facilities feature state-of-the-art climate control, spacious whelping areas, and dedicated training spaces designed with our dogs' comfort and safety in mind."
    }
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">News Archive</h1>
        <p className="text-gray-600">
          Stay updated with the latest news, achievements, and insights from our kennel.
        </p>
      </div>

      {/* Featured Post */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured</h2>
        <HighlightedNewsPost
          imageUrl={featuredPost.imageUrl}
          imageAlt={featuredPost.imageAlt}
          date={featuredPost.date}
          title={featuredPost.title}
          excerpt={featuredPost.excerpt}
          dateFormat="long"
          backgroundColor="transparent"
        />
      </div>

      {/* All News Posts Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All News</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsPosts.map((post, index) => (
            <NewsPost
              key={post.id}
              imageUrl={post.imageUrl}
              imageAlt={post.imageAlt}
              date={post.date}
              title={post.title}
              excerpt={post.excerpt}
              size={index % 3 === 0 ? "lg" : index % 2 === 0 ? "md" : "sm"}
              dateFormat="short"
            />
          ))}
        </div>
      </div>

      {/* Pagination placeholder - you can implement this later */}
      <div className="flex justify-center pt-8">
        <div className="text-gray-500 text-sm">
          Showing {newsPosts.length} news posts
        </div>
      </div>
    </div>
  );
}

export default NewsPage;
