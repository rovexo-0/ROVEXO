export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
};

export type CategoryPath = {
  category: CategoryNode;
  subcategory: CategoryNode;
  childCategory?: CategoryNode;
};

export type FlatCategoryPath = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  subcategoryId: string;
  subcategoryName: string;
  subcategorySlug: string;
  childCategoryId?: string;
  childCategoryName?: string;
  childCategorySlug?: string;
  pathLabel: string;
};
