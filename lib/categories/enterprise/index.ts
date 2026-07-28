import { buildEnterpriseTree, countTreeNodes } from "@/lib/categories/enterprise/builder";
import { ENTERPRISE_SECTORS } from "@/lib/categories/enterprise/sectors";
import { assertCatalogMasterTreeOrThrow } from "@/lib/catalog/catalog-master-protection-v1";

const builtTree = buildEnterpriseTree(ENTERPRISE_SECTORS);
assertCatalogMasterTreeOrThrow(builtTree, "enterprise/categoryTree");

export const categoryTree = builtTree;

export const homeCategories = categoryTree.map(({ name, slug }) => ({ name, slug }));

export const taxonomyStats = countTreeNodes(categoryTree);

export { ENTERPRISE_SECTORS } from "@/lib/categories/enterprise/sectors";
export { buildEnterpriseTree, countTreeNodes } from "@/lib/categories/enterprise/builder";
