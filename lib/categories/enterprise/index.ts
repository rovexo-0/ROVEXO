import { buildEnterpriseTree, countTreeNodes } from "@/lib/categories/enterprise/builder";
import { ENTERPRISE_SECTORS } from "@/lib/categories/enterprise/sectors";

export const categoryTree = buildEnterpriseTree(ENTERPRISE_SECTORS);

export const homeCategories = categoryTree.map(({ name, slug }) => ({ name, slug }));

export const taxonomyStats = countTreeNodes(categoryTree);

export { ENTERPRISE_SECTORS } from "@/lib/categories/enterprise/sectors";
export { buildEnterpriseTree, countTreeNodes } from "@/lib/categories/enterprise/builder";
