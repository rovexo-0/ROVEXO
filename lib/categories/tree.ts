import type { CategoryNode } from "@/lib/categories/types";

/**
 * Canonical ROVEXO category tree.
 * All AI Camera and sell-flow category selection MUST resolve to paths in this tree.
 * Never create categories outside this structure.
 */
export const categoryTree: CategoryNode[] = [
  {
    id: "cat-fashion",
    name: "Fashion",
    slug: "fashion",
    children: [
      {
        id: "cat-fashion-shoes",
        name: "Shoes",
        slug: "shoes",
        children: [
          { id: "cat-fashion-shoes-trainers", name: "Trainers", slug: "trainers" },
          { id: "cat-fashion-shoes-boots", name: "Boots", slug: "boots" },
          { id: "cat-fashion-shoes-heels", name: "Heels", slug: "heels" },
        ],
      },
      {
        id: "cat-fashion-clothing",
        name: "Clothing",
        slug: "clothing",
        children: [
          { id: "cat-fashion-clothing-tops", name: "Tops", slug: "tops" },
          { id: "cat-fashion-clothing-jeans", name: "Jeans", slug: "jeans" },
          { id: "cat-fashion-clothing-coats", name: "Coats", slug: "coats" },
        ],
      },
      {
        id: "cat-fashion-accessories",
        name: "Accessories",
        slug: "accessories",
        children: [
          { id: "cat-fashion-accessories-bags", name: "Bags", slug: "bags" },
          { id: "cat-fashion-accessories-watches", name: "Watches", slug: "watches" },
        ],
      },
    ],
  },
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    children: [
      {
        id: "cat-electronics-audio",
        name: "Audio",
        slug: "audio",
        children: [
          { id: "cat-electronics-audio-headphones", name: "Headphones", slug: "headphones" },
          { id: "cat-electronics-audio-speakers", name: "Speakers", slug: "speakers" },
          { id: "cat-electronics-audio-earbuds", name: "Earbuds", slug: "earbuds" },
        ],
      },
      {
        id: "cat-electronics-phones",
        name: "Phones & Tablets",
        slug: "phones-tablets",
        children: [
          { id: "cat-electronics-phones-smartphones", name: "Smartphones", slug: "smartphones" },
          { id: "cat-electronics-phones-tablets", name: "Tablets", slug: "tablets" },
          { id: "cat-electronics-phones-wearables", name: "Wearables", slug: "wearables" },
        ],
      },
      {
        id: "cat-electronics-computing",
        name: "Computing",
        slug: "computing",
        children: [
          { id: "cat-electronics-computing-laptops", name: "Laptops", slug: "laptops" },
          { id: "cat-electronics-computing-accessories", name: "Accessories", slug: "accessories" },
        ],
      },
    ],
  },
  {
    id: "cat-home-garden",
    name: "Home & Garden",
    slug: "home-garden",
    children: [
      {
        id: "cat-home-furniture",
        name: "Furniture",
        slug: "furniture",
        children: [
          { id: "cat-home-furniture-seating", name: "Seating", slug: "seating" },
          { id: "cat-home-furniture-tables", name: "Tables", slug: "tables" },
        ],
      },
      {
        id: "cat-home-appliances",
        name: "Appliances",
        slug: "appliances",
        children: [
          { id: "cat-home-appliances-cleaning", name: "Cleaning", slug: "cleaning" },
          { id: "cat-home-appliances-kitchen", name: "Kitchen", slug: "kitchen" },
        ],
      },
    ],
  },
  {
    id: "cat-vehicles",
    name: "Vehicles",
    slug: "vehicles",
    children: [
      {
        id: "cat-vehicles-cars",
        name: "Cars",
        slug: "cars",
        children: [
          { id: "cat-vehicles-cars-parts", name: "Parts", slug: "parts" },
          { id: "cat-vehicles-cars-accessories", name: "Accessories", slug: "accessories" },
        ],
      },
      {
        id: "cat-vehicles-bikes",
        name: "Bikes",
        slug: "bikes",
        children: [
          { id: "cat-vehicles-bikes-road", name: "Road Bikes", slug: "road-bikes" },
          { id: "cat-vehicles-bikes-mountain", name: "Mountain Bikes", slug: "mountain-bikes" },
        ],
      },
    ],
  },
  {
    id: "cat-sports",
    name: "Sports",
    slug: "sports",
    children: [
      {
        id: "cat-sports-footwear",
        name: "Footwear",
        slug: "footwear",
        children: [
          { id: "cat-sports-footwear-running", name: "Running", slug: "running" },
          { id: "cat-sports-footwear-football", name: "Football", slug: "football" },
        ],
      },
      {
        id: "cat-sports-equipment",
        name: "Equipment",
        slug: "equipment",
        children: [
          { id: "cat-sports-equipment-fitness", name: "Fitness", slug: "fitness" },
          { id: "cat-sports-equipment-outdoor", name: "Outdoor", slug: "outdoor" },
        ],
      },
    ],
  },
  {
    id: "cat-beauty",
    name: "Beauty",
    slug: "beauty",
    children: [
      {
        id: "cat-beauty-skincare",
        name: "Skincare",
        slug: "skincare",
        children: [
          { id: "cat-beauty-skincare-moisturisers", name: "Moisturisers", slug: "moisturisers" },
          { id: "cat-beauty-skincare-serums", name: "Serums", slug: "serums" },
        ],
      },
      {
        id: "cat-beauty-makeup",
        name: "Makeup",
        slug: "makeup",
        children: [
          { id: "cat-beauty-makeup-face", name: "Face", slug: "face" },
          { id: "cat-beauty-makeup-lips", name: "Lips", slug: "lips" },
        ],
      },
    ],
  },
  {
    id: "cat-toys",
    name: "Toys",
    slug: "toys",
    children: [
      {
        id: "cat-toys-building",
        name: "Building & Blocks",
        slug: "building-blocks",
        children: [
          { id: "cat-toys-building-lego", name: "LEGO & Bricks", slug: "lego-bricks" },
        ],
      },
      {
        id: "cat-toys-games",
        name: "Games",
        slug: "games",
        children: [
          { id: "cat-toys-games-board", name: "Board Games", slug: "board-games" },
          { id: "cat-toys-games-video", name: "Video Games", slug: "video-games" },
        ],
      },
    ],
  },
  {
    id: "cat-books",
    name: "Books",
    slug: "books",
    children: [
      {
        id: "cat-books-fiction",
        name: "Fiction",
        slug: "fiction",
        children: [
          { id: "cat-books-fiction-crime", name: "Crime & Thriller", slug: "crime-thriller" },
          { id: "cat-books-fiction-scifi", name: "Sci-Fi & Fantasy", slug: "sci-fi-fantasy" },
        ],
      },
      {
        id: "cat-books-nonfiction",
        name: "Non-Fiction",
        slug: "non-fiction",
        children: [
          { id: "cat-books-nonfiction-biography", name: "Biography", slug: "biography" },
        ],
      },
    ],
  },
  {
    id: "cat-collectibles",
    name: "Collectibles",
    slug: "collectibles",
    children: [
      {
        id: "cat-collectibles-trading",
        name: "Trading Cards",
        slug: "trading-cards",
        children: [
          { id: "cat-collectibles-trading-sports", name: "Sports Cards", slug: "sports-cards" },
        ],
      },
      {
        id: "cat-collectibles-vintage",
        name: "Vintage",
        slug: "vintage",
        children: [
          { id: "cat-collectibles-vintage-cameras", name: "Cameras", slug: "cameras" },
        ],
      },
    ],
  },
  {
    id: "cat-pets",
    name: "Pets",
    slug: "pets",
    children: [
      {
        id: "cat-pets-dogs",
        name: "Dogs",
        slug: "dogs",
        children: [
          { id: "cat-pets-dogs-accessories", name: "Accessories", slug: "accessories" },
          { id: "cat-pets-dogs-clothing", name: "Clothing", slug: "clothing" },
        ],
      },
      {
        id: "cat-pets-cats",
        name: "Cats",
        slug: "cats",
        children: [
          { id: "cat-pets-cats-accessories", name: "Accessories", slug: "accessories" },
        ],
      },
    ],
  },
];

export const homeCategories = categoryTree.map(({ name, slug }) => ({ name, slug }));
