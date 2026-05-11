import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ujmmehobjbztiwumtgpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbW1laG9iamJ6dGl3dW10Z3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTA1NzksImV4cCI6MjA5Mzk2NjU3OX0.96RGWa-6xcZ0cRaRfgr6e6ImPS70dCWD9WLgUwZ2-QU'
const supabase = createClient(supabaseUrl, supabaseKey)

const posts = [
  {
    title: "The Art of Minimalist Packaging: Why Less is More",
    excerpt: "In a world of constant noise, minimalist design stands out by saying more with less. Explore how clean lines and thoughtful space can elevate your brand's physical presence.",
    content: "The trend towards minimalism in packaging is more than just an aesthetic choice; it's a strategic move that reflects changing consumer values. Today's customers are overwhelmed by visual clutter and are increasingly drawn to brands that offer clarity, honesty, and simplicity.\n\nAt Wings Graphics, we've seen firsthand how a reduced color palette and generous white space can actually increase a product's 'premium' feel. When you remove the unnecessary, the quality of the materials and the strength of the brand message take center stage.\n\nKey takeaways for your next project:\n1. Focus on one hero element (logo or product name).\n2. Use tactile finishes like spot UV or embossing instead of busy graphics.\n3. Choose sustainable, high-quality papers that feel good in the hand.",
    category: "Branding",
    author: "Wings Editorial",
    status: "published",
    image_url: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Digital vs. Offset: Choosing the Right Print Process",
    excerpt: "Quality, quantity, and budget — we break down the technical differences between digital and offset printing to help you choose the best fit for your next campaign.",
    content: "One of the most common questions we get at our studio is: 'Should I go digital or offset?' The answer depends on three main factors: volume, turnaround time, and specific quality requirements.\n\nOffset printing remains the gold standard for large runs (1000+ units). It uses real ink and metal plates, providing the most accurate color reproduction and the lowest cost per unit for high volumes. If you need 5,000 brochures with precise Pantone matching, offset is your best friend.\n\nDigital printing, however, has closed the quality gap significantly. It's ideal for short runs, personalized mailers (Variable Data Printing), and projects that need to be delivered 'yesterday.' There are no plates to set up, which means lower initial costs and lightning-fast turnaround times.",
    category: "Printing",
    author: "Wings Editorial",
    status: "published",
    image_url: "https://images.unsplash.com/photo-1562654501-a0ccc0af3fb1?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Modern Web Design: Bringing Print Aesthetics to the Browser",
    excerpt: "How we translate the tactile beauty of premium print into fluid, digital experiences that feel alive and responsive.",
    content: "The bridge between print and web is narrowing. With modern CSS and advanced animation libraries like Framer Motion, we can now recreate the grid systems and typographic hierarchies that once made high-end editorial design exclusive to paper.\n\nIn our latest web projects, we've been experimenting with 'Digital Tactility' — using subtle textures, smooth transitions, and organic layouts to make a website feel like a living document rather than just a screen. This approach builds a cohesive brand story where the website feels like a direct extension of the physical business card or brochure.",
    category: "Web Design",
    author: "Wings Editorial",
    status: "published",
    image_url: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=1200"
  }
]

async function seed() {
  console.log('Seeding blog articles...')
  const { error } = await supabase.from('blog').insert(posts)
  if (error) console.error('Error seeding:', error)
  else console.log('Successfully seeded 3 articles!')
}

seed()
