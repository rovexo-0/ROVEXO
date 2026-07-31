import type { ProductCategoryManual } from "@/lib/documentation/documentation-engine-v1";
import { product } from "@/lib/documentation/product-seed-v1";

const RELATED = [
  { title: "Seller Terms", href: "/legal/seller-terms" },
  { title: "Acceptable Use Policy", href: "/legal/acceptable-use-policy" },
  { title: "Help — Safety", href: "/help/category/safety" },
];

export const MEDICINES_CATEGORY: ProductCategoryManual = {
  id: "medicines-medical",
  title: "Medicines, medical devices, and related products",
  overview:
    "ROVEXO is not a pharmacy. Prescription medicines and many controlled medical products are Prohibited. Some sealed over-the-counter products and non-medical wellness items may be Restricted or Allowed with strict rules.",
  marketplaceRule:
    "Never sell prescription-only medicines, antibiotics requiring prescription, injectable hormones/steroids, or vaccines. Sealed general-sale OTC products may be Restricted. Opened medicines are Prohibited.",
  ukLegal:
    "UK medicines law (including MHRA rules) controls what the public may sell. Selling prescription medicines without authority is illegal. ROVEXO bans pharmacy-style sales.",
  allowedExamples: ["Empty unused pill organisers", "Non-medicated first-aid accessories (plasters without medicinal claims beyond normal retail)"] ,
  restrictedExamples: ["Sealed general-sale vitamins and some supplements with honest labelling", "Sealed non-prescription medical devices with UK compliance marks where retail sale is lawful"],
  prohibitedExamples: ["Prescription medicines", "Antibiotics", "Steroids / hormone abuse products", "Insulin and vaccines", "Opened medicines"],
  specialConditions: "No medical claims that turn a cosmetic or food into an unlicensed medicine. Expiry dates must be future-dated for any Allowed/Restricted ingestible product.",
  buyerRisks: "Fake or unsuitable medicines can cause serious harm. Buy medicines from regulated pharmacies, not grey-market listings.",
  sellerResponsibilities: "Do not list prescription products. Check whether an item is POM/P/GSL before listing. When unsure, do not list.",
  moderationRules: "Keyword and image detection for medicine packs, automatic blocks for POM indicators, manual review for supplements/CBD.",
  aiDetection: "Packaging OCR/keyword hits for prescription markers, steroid terms, antibiotic names, syringe imagery, and pharmacy language trigger blocks or review.",
  commonMistakes: "Selling leftover antibiotics; listing CBD with medicinal cure claims; selling opened perfume as medicine-adjacent without reading cosmetics rules.",
  products: [
    product({ id: "prescription-medicines", name: "Prescription medicines", classification: "prohibited", why: "Prescription-only medicines require authorised supply.", rule: "Prohibited.", aliases: ["POM", "Rx medicines"], faq: [{ question: "Can I sell leftover prescription tablets?", answer: "No. Prescription medicines are Prohibited." }] }),
    product({ id: "otc-medicines", name: "Over-the-counter medicines", classification: "restricted", why: "Some GSL OTC products may be retailable; many pharmacy medicines are not.", rule: "Restricted. Only sealed general-sale products that are lawful for public retail may be considered. Opened packs are Prohibited.", faq: [{ question: "Can I sell sealed paracetamol?", answer: "Only if it is a lawful general-sale pack, sealed, in-date, and passes Restricted review. When unsure, do not list." }] }),
    product({ id: "antibiotics", name: "Antibiotics", classification: "prohibited", why: "Antibiotics require controlled supply and misuse drives resistance.", rule: "Prohibited." }),
    product({ id: "painkillers", name: "Painkillers", classification: "restricted", why: "Strength and legal class vary.", rule: "Restricted for sealed general-sale retail packs only. Prescription-strength painkillers are Prohibited." }),
    product({ id: "vaccines", name: "Vaccines", classification: "prohibited", why: "Vaccines require regulated cold-chain clinical supply.", rule: "Prohibited." }),
    product({ id: "hormones", name: "Hormones", classification: "prohibited", why: "Hormone medicines are controlled.", rule: "Prohibited, including unlicensed hormone products." }),
    product({ id: "steroids", name: "Steroids", classification: "prohibited", why: "Anabolic steroids and related abuse products are Prohibited.", rule: "Prohibited.", aliases: ["anabolic", "AAS"] }),
    product({ id: "insulin", name: "Insulin", classification: "prohibited", why: "Insulin is a prescription medicine requiring clinical supply.", rule: "Prohibited." }),
    product({ id: "medical-devices", name: "Medical Devices", classification: "restricted", why: "Devices range from simple supports to regulated equipment.", rule: "Restricted. Non-invasive consumer devices with honest descriptions may pass review. Prescription or clinical-only devices are Prohibited." }),
    product({ id: "testing-kits", name: "Testing Kits", classification: "restricted", why: "Home test kits vary in regulation and accuracy claims.", rule: "Restricted. No false diagnostic claims. Clinical/lab-only kits are Prohibited." }),
    product({ id: "supplements", name: "Supplements", classification: "restricted", why: "Supplements are not medicines but are often mis-sold with medical claims.", rule: "Restricted. Sealed, in-date, no disease-cure claims. Contaminated or steroid-spiked products are Prohibited." }),
    product({ id: "vitamins", name: "Vitamins", classification: "restricted", why: "Vitamins are common retail products when sealed and honestly labelled.", rule: "Restricted. Sealed and in-date only. Opened vitamins are Prohibited." }),
    product({ id: "cbd", name: "CBD", classification: "restricted", why: "CBD products sit under novel food / controlled substance edge cases.", rule: "Restricted. Only clearly lawful consumer CBD products with honest non-medicinal claims may be considered. THC cannabis products are Prohibited.", faq: [{ question: "Can I sell CBD oil?", answer: "Only lawful consumer CBD products under Restricted review with no medicinal cure claims. Cannabis/THC products are Prohibited." }], aliases: ["CBD oil", "cannabidiol"] }),
  ],
  faqs: [
    { question: "Can I sell prescription medicines?", answer: "No. Prohibited." },
    { question: "Can I sell CBD oil?", answer: "Only lawful consumer CBD under Restricted review; never THC cannabis products." },
    { question: "Can I sell opened medicine?", answer: "No. Opened medicines are Prohibited." },
    { question: "Can I sell insulin?", answer: "No. Prohibited." },
  ],
  relatedPolicies: RELATED,
};

export const COSMETICS_CATEGORY: ProductCategoryManual = {
  id: "cosmetics",
  title: "Cosmetics, perfume, and personal care",
  overview: "Most sealed cosmetics are Allowed. Used make-up and many opened liquids are Restricted or Prohibited for hygiene and safety reasons.",
  marketplaceRule: "Sealed, in-date cosmetics are generally Allowed. Used make-up that contacts skin/eyes is typically Prohibited. Opened perfume may be Restricted with honest disclosure.",
  ukLegal: "Cosmetic product safety regulations and hygiene expectations apply. Do not sell recalled or unsafe cosmetics.",
  allowedExamples: ["Sealed lipstick", "Sealed skincare", "Sealed perfume"],
  restrictedExamples: ["Opened perfume with majority remaining and clear photos", "Professional salon products sold unused/sealed"],
  prohibitedExamples: ["Used mascara/lipstick/sponge applicators", "Expired cosmetics", "Medical cosmetics making unlicensed medicine claims"],
  specialConditions: "Always show expiry/PAO where relevant. No counterfeit designer fragrance.",
  buyerRisks: "Contamination, allergic reaction, counterfeit fragrance, expired products.",
  sellerResponsibilities: "State sealed vs opened, batch/expiry if known, and authenticity. Do not sell used eye products.",
  moderationRules: "Counterfeit brand detection; hygiene keyword/image review for used beauty.",
  aiDetection: "Brand detection for luxury fragrance, “used” beauty keywords, expiry language, duplicate counterfeit patterns.",
  commonMistakes: "Selling used mascara; listing opened perfume as sealed; fake designer fragrance.",
  products: [
    product({ id: "perfume", name: "Perfume", classification: "restricted", why: "Perfume is commonly sold but authenticity and opening state matter.", rule: "Sealed authentic perfume is generally Allowed; opened perfume is Restricted with disclosure; counterfeit is Prohibited.", faq: [{ question: "Can I sell opened perfume?", answer: "Possibly under Restricted rules with clear photos and fill-level disclosure. Counterfeit perfume is Prohibited." }] }),
    product({ id: "opened-perfume", name: "Opened perfume", classification: "restricted", why: "Opened perfume can be resold if honestly described, but hygiene and authenticity risks rise.", rule: "Restricted. Show fill level and that it is opened. No returns assumptions — state condition." }),
    product({ id: "sealed-perfume", name: "Sealed perfume", classification: "allowed", why: "Sealed authentic fragrance is a standard Allowed marketplace good.", rule: "Allowed when authentic and sealed." }),
    product({ id: "make-up", name: "Make-up", classification: "restricted", why: "Depends on sealed vs used and product type.", rule: "Sealed make-up Allowed/Restricted by type; used eye/lip products typically Prohibited." }),
    product({ id: "used-make-up", name: "Used make-up", classification: "prohibited", why: "Used cosmetics create infection and hygiene risks.", rule: "Prohibited for products that contacted skin, eyes, or lips. Unused sealed only." }),
    product({ id: "hair-dye", name: "Hair dye", classification: "restricted", why: "Chemical products need intact labelling and unopened packaging.", rule: "Restricted. Sealed only. Opened hair dye Prohibited." }),
    product({ id: "skin-care", name: "Skin care", classification: "allowed", why: "Sealed skincare is commonly Allowed.", rule: "Allowed when sealed and in-date. Opened jars Restricted/Prohibited depending on hygiene risk." }),
    product({ id: "medical-cosmetics", name: "Medical cosmetics", classification: "restricted", why: "Borderline medicinal claims push products into medicines rules.", rule: "Restricted. No unlicensed medicine claims. Prescription topicals are Prohibited." }),
    product({ id: "professional-salon-products", name: "Professional salon products", classification: "restricted", why: "Trade-only products may have supply restrictions.", rule: "Restricted. Unused/sealed only; follow brand supply rules." }),
    product({ id: "expiry-requirements", name: "Expiry requirements", classification: "restricted", why: "Expired cosmetics are unsafe.", rule: "Expired cosmetics are Prohibited. In-date sealed products may be Allowed/Restricted by type.", faq: [{ question: "Can I sell an expired cosmetic?", answer: "No. Expired cosmetics are Prohibited." }] }),
  ],
  faqs: [
    { question: "Can I sell opened perfume?", answer: "Restricted — disclose opened status and fill level. Counterfeits are Prohibited." },
    { question: "Can I sell an expired cosmetic?", answer: "No." },
    { question: "Can I sell used make-up?", answer: "Generally no for used eye/lip/skin-contact products." },
  ],
  relatedPolicies: RELATED,
};
