import { notFound } from 'next/navigation';
import AppNavigation from '../../../components/AppNavigation'; // Import the navigation component
import type { Metadata } from 'next';

// Define chemical data directly in the file
const chemicalData: Record<string, {
  name: string;
  description: string;
  applications: string[];
  suppliers: number;
  formula: string;
  cas: string;
  weight: string;
  appearance: string;
}> = {
  "sulphuric-acid": {
    name: "Sulphuric Acid",
    description: "Sulphuric acid (H₂SO₄) is one of the most important industrial chemicals. The growing demand from the metal processing industry in the removal of rust and other contaminants from different metal surfaces including iron, steel, copper, and aluminium is anticipated to positively impact market growth. It's extensively used in chemical manufacturing, fertilizers, metal processing, textile production, pulp and paper, and automobile manufacturing.",
    applications: [
      "Fertilizer production (phosphate fertilizers)",
      "Mineral processing and metal extraction",
      "Petroleum refining",
      "Wastewater treatment",
      "Chemical synthesis (dyes, pigments, explosives)"
    ],
    suppliers: 1250,
    formula: "H₂SO₄",
    cas: "7664-93-9",
    weight: "98.08 g/mol",
    appearance: "Colorless viscous liquid"
  },
  "nitric-acid": {
    name: "Nitric Acid",
    description: "Nitric acid (HNO₃) is a highly corrosive mineral acid used primarily for the production of fertilizers, explosives, and various organic nitro compounds. Over 80% of nitric acid is used in fertilizer manufacturing like Ammonium Nitrate and Calcium Ammonium Nitrate. It's also a raw material for inks, pigments, and dyes with major applications in the textile industry.",
    applications: [
      "Fertilizer production (ammonium nitrate)",
      "Explosives manufacturing (TNT, nitroglycerin)",
      "Metal processing and etching",
      "Rocket propellant",
      "Production of nylon precursors"
    ],
    suppliers: 875,
    formula: "HNO₃",
    cas: "7697-37-2",
    weight: "63.01 g/mol",
    appearance: "Colorless to yellow liquid"
  },
  "caustic-soda": {
    name: "Caustic Soda",
    description: "Caustic soda (sodium hydroxide, NaOH) is an inorganic bulk chemical, strongly alkaline & odourless. It finds applications in several industries such as soaps & detergents, paper & pulp, textile finishing, water treatment, metal processing, and refining bauxite.",
    applications: [
      "Pulp and paper processing",
      "Textile manufacturing (mercerization)",
      "Soap and detergent production",
      "Water treatment (pH adjustment)",
      "Alumina production (Bayer process)"
    ],
    suppliers: 1420,
    formula: "NaOH",
    cas: "1310-73-2",
    weight: "40.00 g/mol",
    appearance: "White crystalline solid"
  },
  "hydrogen-peroxide": {
    name: "Hydrogen Peroxide",
    description: "Hydrogen peroxide (H₂O₂) is a versatile oxidizing agent with applications in bleaching, disinfection, wastewater treatment, and chemical synthesis. Its potent oxidising capabilities are at the heart of its role in many industrial processes and products. Because its concentration and dosage can be easily adjusted, it is highly versatile.",
    applications: [
      "Pulp and paper bleaching",
      "Textile bleaching",
      "Water and wastewater treatment",
      "Disinfectant and antiseptic",
      "Organic synthesis (epoxidation)"
    ],
    suppliers: 980,
    formula: "H₂O₂",
    cas: "7722-84-1",
    weight: "34.01 g/mol",
    appearance: "Pale blue liquid"
  },
  "chlorine": {
    name: "Chlorine",
    description: "Chlorine (Cl₂) is one of the essential elements consumed during everyday life. PVC is the primary area of application for chlorine across the globe. It's used in manufacturing of Pharmaceutical Intermediate, Polyvinyl Chloride (PVC), Pesticides, Chemical Intermediate, Water Disinfectants, Isocyanates and Oxygenates, Chloromethanes, Solvents, Epoxy Resin, Automotive Parts, and Cleaning Products.",
    applications: [
      "Water disinfection and purification",
      "PVC and plastic manufacturing",
      "Bleaching agents production",
      "Pharmaceutical intermediates",
      "Solvents and agrochemicals"
    ],
    suppliers: 1120,
    formula: "Cl₂",
    cas: "7782-50-5",
    weight: "70.90 g/mol",
    appearance: "Pale green gas"
  },
  "bromine": {
    name: "Bromine",
    description: "Bromine (Br₂) is a volatile red-brown liquid at room temperature that evaporates easily to form a similarly colored gas. It's used in a wide range of industries, including textile, pharmaceuticals, oil and gas drilling, food and beverage, home furniture and appliances, electronics, and construction. Bromine is essential in the production of soft drink bottles, synthetic garments, car tires, medicine, cosmetics, and more.",
    applications: [
      "Flame retardants production",
      "Water treatment compounds",
      "Pharmaceuticals synthesis",
      "Agricultural chemicals",
      "Drilling fluids"
    ],
    suppliers: 650,
    formula: "Br₂",
    cas: "7726-95-6",
    weight: "159.81 g/mol",
    appearance: "Red-brown liquid"
  },
  "hydrobromic-acid": {
    name: "Hydrobromic Acid",
    description: "Hydrobromic acid is a strong acid formed by dissolving the diatomic molecule hydrogen bromide (HBr) in water. It's used extensively for various applications in chemical sector, particularly for making inorganic and organic bromides like Zinc bromides, Sodium Bromide, Allyl bromide and bromo acetic acid which are used in Agricultural chemicals, Dye stuffs, Pharmaceuticals, chemical Industries.",
    applications: [
      "Catalyst in organic reactions",
      "Production of inorganic bromides",
      "Pharmaceutical intermediates",
      "Etching and engraving agent",
      "Chemical synthesis reagent"
    ],
    suppliers: 480,
    formula: "HBr",
    cas: "10035-10-6",
    weight: "80.91 g/mol",
    appearance: "Colorless to yellow liquid"
  },
  "ethanol": {
    name: "Ethanol",
    description: "Ethanol (C₂H₅OH) is a volatile, flammable, colorless liquid with a characteristic wine-like odor and pungent taste. The oil and energy sector is one of its most important application sectors, as ethanol functions as a biofuel mixed with gasoline to reduce emission and reduce fossil fuels. In pharmaceuticals and healthcare, it's used as a solvent, disinfectant and in the production of drugs and sanitizers.",
    applications: [
      "Alcoholic beverages production",
      "Industrial solvent",
      "Fuel and fuel additive",
      "Hand sanitizers",
      "Chemical synthesis"
    ],
    suppliers: 2300,
    formula: "C₂H₅OH",
    cas: "64-17-5",
    weight: "46.07 g/mol",
    appearance: "Colorless liquid"
  },
  "acetone": {
    name: "Acetone",
    description: "Acetone (CH₃COCH₃) is the simplest and smallest ketone, produced globally as by-product of Phenol. It's used as a starting material for synthesis of other chemicals and feedstock in the production of solvents. It has applications in major industries like paints, personal care, cosmetic, coating & automobile industry.",
    applications: [
      "Industrial solvent",
      "Nail polish remover",
      "Paint thinner",
      "Chemical precursor",
      "Laboratory reagent"
    ],
    suppliers: 1850,
    formula: "C₃H₆O",
    cas: "67-64-1",
    weight: "58.08 g/mol",
    appearance: "Colorless liquid"
  },
  "acetic-acid": {
    name: "Acetic Acid",
    description: "Acetic acid is utilized as a chemical reagent in the production of many chemical compounds. The major use is in the manufacturing of Vinyl Acetate Monomer, Purified Terephthalic Acid, Ethyl Acetate, Acetic Anhydride, Cellulose Acetate, Acetic Esters, Dyes, Vinegar, Photochemical and others.",
    applications: [
      "Vinyl acetate monomer production",
      "Purified terephthalic acid (PTA) manufacturing",
      "Solvent in ink, paint and coating industries",
      "Food industry (as vinegar)",
      "Production of cellulose acetate"
    ],
    suppliers: 1350,
    formula: "CH₃COOH",
    cas: "64-19-7",
    weight: "60.05 g/mol",
    appearance: "Colorless liquid"
  },
  "acrylic-acid": {
    name: "Acrylic Acid",
    description: "The acrylic acid market is booming due to robust construction and infrastructure growth, which demands paints, coatings, adhesives, and sealants. Acrylic acid is a primary raw material for super absorbent polymers, widely used in diapers, sanitary napkins, and adult incontinence products.",
    applications: [
      "Super absorbent polymers for hygiene products",
      "Paints and coatings formulations",
      "Adhesives and sealants",
      "Textile finishes",
      "Plastic additives"
    ],
    suppliers: 920,
    formula: "C₃H₄O₂",
    cas: "79-10-7",
    weight: "72.06 g/mol",
    appearance: "Colorless liquid"
  },
  "adipic-acid": {
    name: "Adipic Acid",
    description: "Adipic acid is a white, crystalline dicarboxylic acid primarily produced through the oxidation of cyclohexane. It's used in the production of nylon 6,6, a versatile polymer used in textiles, carpets, and automotive parts. The thriving automotive industry, where adipic acid is used in resins for lightweight and durable parts, is propelling market growth.",
    applications: [
      "Nylon 6,6 production",
      "Polyurethane manufacturing",
      "Plasticizers",
      "Food additives",
      "Lubricant components"
    ],
    suppliers: 780,
    formula: "C₆H₁₀O₄",
    cas: "124-04-9",
    weight: "146.14 g/mol",
    appearance: "White crystalline powder"
  },
  "butyl-acetate": {
    name: "Butyl Acetate",
    description: "Butyl acetate finds extensive application across diverse industries, including paints and coatings, adhesives, pharmaceuticals, and textiles. Its excellent solvency properties and ability to dissolve various resins and polymers make it a preferred choice as a solvent in paints, varnishes, and lacquers.",
    applications: [
      "Solvent in paints and coatings",
      "Lacquer formulations",
      "Adhesives production",
      "Pharmaceutical extraction",
      "Printing inks"
    ],
    suppliers: 680,
    formula: "CH₃COO(CH₂)₃CH₃",
    cas: "123-86-4",
    weight: "116.16 g/mol",
    appearance: "Colorless liquid"
  },
  "butyraldehyde": {
    name: "Butyraldehyde",
    description: "Butyraldehyde (butanal) is a colourless and strong-smelling liquid used as a building block in downstream processes of organic syntheses to produce other products especially n-butanol, 2-ethylhexanol, 2-Ethylhexanoic acid, trimethylolpropane, and polyvinyl buthylal.",
    applications: [
      "Production of plasticizers",
      "Synthesis of 2-ethylhexanol",
      "Polyvinyl butyral manufacturing",
      "Perfumery and flavor additives",
      "Textile auxiliaries"
    ],
    suppliers: 520,
    formula: "C₄H₈O",
    cas: "123-72-8",
    weight: "72.11 g/mol",
    appearance: "Colorless liquid"
  },
  "cyclohexane": {
    name: "Cyclohexane",
    description: "Cyclohexane is a flammable, non-polar, colorless liquid with a detergent-like odour. It's used to make hexamethylenediamine, caprolactam and adipic acid which are then used to make Nylon 6 & Nylon 6,6. It's also used in production of paint, rubber and other industrial products.",
    applications: [
      "Nylon 6 and Nylon 6,6 production",
      "Solvent for resins and lacquers",
      "Paint and varnish formulations",
      "Rubber manufacturing",
      "Chemical intermediate"
    ],
    suppliers: 890,
    formula: "C₆H₁₂",
    cas: "110-82-7",
    weight: "84.16 g/mol",
    appearance: "Colorless liquid"
  },
  "cyclohexanone": {
    name: "Cyclohexanone",
    description: "Cyclohexanone (oxocyclohexane) is a clear oily liquid with a colorless or pale yellow tinge and a pungent odor. The demand is primarily driven by its use for production of caprolactam and adipic acid. Caprolactam is extensively used in the manufacture of nylon and is further used in various end-use sectors such as manufacturing, automobile, consumer goods, and electronics.",
    applications: [
      "Caprolactam production for nylon",
      "Adipic acid synthesis",
      "Solvent for resins and polymers",
      "Paint and varnish remover",
      "Agrochemical formulations"
    ],
    suppliers: 760,
    formula: "C₆H₁₀O",
    cas: "108-94-1",
    weight: "98.15 g/mol",
    appearance: "Colorless to pale yellow liquid"
  },
  "dimethylformamide": {
    name: "Dimethylformamide",
    description: "DMF is a universal solvent used as a feedstock for the production of PU, which is a key component in consumer goods such as leather products and shoe soles. DMF as a feedstock is also used in the production of pharmaceutical and agrochemical products.",
    applications: [
      "Polyurethane production",
      "Pharmaceutical synthesis",
      "Acrylic fiber processing",
      "Electronics industry solvent",
      "Agrochemical formulations"
    ],
    suppliers: 640,
    formula: "C₃H₇NO",
    cas: "68-12-2",
    weight: "73.09 g/mol",
    appearance: "Colorless liquid"
  },
  "benzene": {
    name: "Benzene",
    description: "Benzene is a colorless or light-yellow chemical compound composed of carbon and hydrogen atoms. It's liquid at room temperature, highly flammable, and evaporates quickly. Benzene is used in various industrial and consumer products, including as a solvent in the chemical and pharmaceutical sectors, as well as in gasoline, adhesives, cleaning products, and paint thinners.",
    applications: [
      "Ethylbenzene/styrene production",
      "Cumene/phenol production",
      "Cyclohexane/nylon intermediates",
      "Solvent in manufacturing",
      "Gasoline additive"
    ],
    suppliers: 1520,
    formula: "C₆H₆",
    cas: "71-43-2",
    weight: "78.11 g/mol",
    appearance: "Colorless liquid"
  },
  "toluene": {
    name: "Toluene",
    description: "Toluene is a colorless liquid with a pungent odor derived from petroleum and natural gas. It serves as an important solvent and building block in various applications. Toluene plays a significant role in the production of Toluene Diisocyanate, used primarily in polyurethanes for furniture cushions, insulation, coatings, and automotive parts.",
    applications: [
      "Solvent in paints & coatings",
      "Toluene diisocyanate production",
      "Benzene and xylene production",
      "Fuel additive (octane booster)",
      "Pharmaceutical synthesis"
    ],
    suppliers: 1380,
    formula: "C₇H₈",
    cas: "108-88-3",
    weight: "92.14 g/mol",
    appearance: "Colorless liquid"
  },
  "xylene": {
    name: "Xylene",
    description: "Xylene is a slightly greasy, colorless liquid commonly used as a solvent. It's used in the production of various plastics and polymers, including polyethylene terephthalate (PET) and polyester fibers. Xylene is also a common solvent in the paints and coatings industry.",
    applications: [
      "PET plastic production",
      "Polyester fiber manufacturing",
      "Solvent in paints and coatings",
      "Printing and leather industries",
      "Rubber and adhesive production"
    ],
    suppliers: 1250,
    formula: "C₈H₁₀",
    cas: "1330-20-7",
    weight: "106.16 g/mol",
    appearance: "Colorless liquid"
  },
  "sodium-methoxide": {
    name: "Sodium Methoxide",
    description: "Sodium methoxide acts as an efficient catalyst in the transesterification process to produce biodiesel from vegetable oils or animal fats. It's also utilized as a reagent in various pharmaceutical synthesis processes.",
    applications: [
      "Biodiesel production catalyst",
      "Pharmaceutical synthesis",
      "Organic synthesis reagent",
      "Edible oil processing",
      "Polymer production"
    ],
    suppliers: 420,
    formula: "CH₃ONa",
    cas: "124-41-4",
    weight: "54.02 g/mol",
    appearance: "White powder"
  },
  "sodium-t-butoxide": {
    name: "Sodium t-Butoxide",
    description: "Sodium t-Butoxide spans multiple industries, including pharmaceuticals, agriculture, and specialty chemicals. In the pharmaceutical industry, it's primarily used in drug synthesis, enabling the development of complex molecules. The agrochemical sector utilizes it in the formulation of herbicides and pesticides.",
    applications: [
      "Pharmaceutical synthesis",
      "Agrochemical formulations",
      "Polymerization catalyst",
      "Organic synthesis reagent",
      "Specialty chemical production"
    ],
    suppliers: 380,
    formula: "(CH₃)₃CONa",
    cas: "865-48-5",
    weight: "96.11 g/mol",
    appearance: "White powder"
  },
  "meta-chloro-aniline": {
    name: "Meta Chloro Aniline",
    description: "Meta Chloro Aniline is a versatile building block for the synthesis of various organic compounds, including dyes, pharmaceuticals, and agrochemicals. Its high reactivity and selectivity make it an essential intermediate in the production of azo dyes for textiles and printing industries.",
    applications: [
      "Azo dye production",
      "Pharmaceutical intermediates",
      "Agrochemical synthesis",
      "Pigment manufacturing",
      "Chemical research"
    ],
    suppliers: 310,
    formula: "C₆H₆ClN",
    cas: "108-42-9",
    weight: "127.57 g/mol",
    appearance: "Colorless to light yellow crystals"
  },
  "para-toluene-sulfonic-acid": {
    name: "Para Toluene Sulfonic Acid",
    description: "PTSA is used as a catalyst in Plasticizer manufacturing DOP, DBP, DEP, Ethly Acetate, Butyl Acetate, Coating industry, Electronic polymers. It's also used as a curing agent in thermosetting resin systems, varnishes, acrylic resins, and foundry resins.",
    applications: [
      "Plasticizer production catalyst",
      "Resin curing agent",
      "Organic synthesis catalyst",
      "Electroplating industry",
      "Pharmaceutical intermediate"
    ],
    suppliers: 570,
    formula: "C₇H₈O₃S",
    cas: "104-15-4",
    weight: "172.20 g/mol",
    appearance: "White crystalline solid"
  },
  "para-toluene-sulfonic-chloride": {
    name: "Para Toluene Sulfonic Chloride",
    description: "P-toluene sulfonyl chloride is generally used as an intermediate for preparation of other chemicals. It's an important intermediate for dyes in organic synthesis and raw materials for pesticides. It can be used for organic synthesis of dyes, saccharin, and to prepare sulfonamides from amines for pharmaceutical applications.",
    applications: [
      "Dye intermediate",
      "Pharmaceutical synthesis",
      "Pesticide production",
      "Sulfonamide preparation",
      "Chemical research"
    ],
    suppliers: 450,
    formula: "C₇H₇ClO₂S",
    cas: "98-59-9",
    weight: "190.64 g/mol",
    appearance: "White to gray powdered solid"
  },
  "thionyl-chloride": {
    name: "Thionyl Chloride",
    description: "Thionyl Chloride (SOCl₂) is a chemical compound widely used in various industrial applications. It's highly reactive and known for its ability to convert carboxylic acids into acyl chlorides, making it a valuable reagent in organic synthesis.",
    applications: [
      "Conversion of carboxylic acids to acyl chlorides",
      "Pharmaceutical synthesis",
      "Battery manufacturing",
      "Dye production",
      "Pesticide formulation"
    ],
    suppliers: 510,
    formula: "SOCl₂",
    cas: "7719-09-7",
    weight: "118.97 g/mol",
    appearance: "Colorless to yellow fuming liquid"
  },
  "cyanuric-chloride": {
    name: "Cyanuric Chloride",
    description: "Cyanuric chloride is a multifunctional intermediate for herbicides, reactive dyes, optical brighteners and many other specialties. The cyanuric chlorides are used in the synthesis of optical brighteners which make substrates appear whiter. It's also an important raw material for the production of numerous reactive dyes.",
    applications: [
      "Herbicide production",
      "Reactive dye manufacturing",
      "Optical brightener synthesis",
      "Textile industry chemicals",
      "Polymer stabilizers"
    ],
    suppliers: 390,
    formula: "C₃Cl₃N₃",
    cas: "108-77-0",
    weight: "184.41 g/mol",
    appearance: "White crystalline solid"
  },
  "sodium-gluconate": {
    name: "Sodium Gluconate",
    description: "Sodium gluconate serves diverse functions across industries. In construction, it serves as a concrete admixture, imparting improved workability, strength, and durability. In food and beverage, it acts as a stabilizer, acidity regulator, and sequestrant. In pharmaceuticals and personal care, it serves as a buffering agent and sequestrant.",
    applications: [
      "Concrete admixture",
      "Food additive (stabilizer)",
      "Pharmaceutical buffering agent",
      "Metal cleaning and surface treatment",
      "Water treatment chemical"
    ],
    suppliers: 530,
    formula: "C₆H₁₁NaO₇",
    cas: "527-07-1",
    weight: "218.14 g/mol",
    appearance: "White crystalline powder"
  },
  "benzoic-acid": {
    name: "Benzoic Acid",
    description: "Benzoic acid is used in the preparation of many phenols in the chemical industry. It's commonly used as a preservative in cosmetics and personal care products such as toothpaste and mouthwash. The use in ointments for fungal skin diseases has increased its global market demand.",
    applications: [
      "Food preservative",
      "Cosmetic preservative",
      "Pharmaceutical intermediate",
      "Plasticizer production",
      "Fungicide for skin treatments"
    ],
    suppliers: 780,
    formula: "C₇H₆O₂",
    cas: "65-85-0",
    weight: "122.12 g/mol",
    appearance: "White crystalline solid"
  },
  "phosphoric-acid": {
    name: "Phosphoric Acid",
    description: "After Sulphuric Acid, phosphoric acid is the most manufactured and consumed inorganic acid. It's generally used to make fertilizers, but also used in cleaning products, food additives, and water treatment. Phosphoric acid is used to make fertilizers such as Diammonium Phosphate and Monoammonium Phosphate.",
    applications: [
      "Fertilizer production (DAP, MAP)",
      "Food and beverage additive",
      "Rust removal and metal treatment",
      "Water treatment chemical",
      "Pharmaceutical intermediate"
    ],
    suppliers: 1120,
    formula: "H₃PO₄",
    cas: "7664-38-2",
    weight: "98.00 g/mol",
    appearance: "Colorless solid or syrupy liquid"
  },
  "phosphorus-trichloride": {
    name: "Phosphorus Trichloride",
    description: "Phosphorus trichloride occupies a pivotal position in modern chemical manufacturing, serving as a fundamental intermediate in the synthesis of agrochemicals, specialty catalysts, flame retardants, pharmaceuticals, and plastic additives.",
    applications: [
      "Agrochemical production",
      "Pharmaceutical intermediates",
      "Plastic additives",
      "Catalyst manufacturing",
      "Flame retardant synthesis"
    ],
    suppliers: 460,
    formula: "PCl₃",
    cas: "7719-12-2",
    weight: "137.33 g/mol",
    appearance: "Colorless to yellow fuming liquid"
  },
  "phosphorus-oxychloride": {
    name: "Phosphorus Oxychloride",
    description: "Phosphorus oxychloride is an important intermediate for flame retardant additives, specialty fluids, pharma & fine chemical intermediates and crop protection products. Due to its hazardous nature, appropriate precautions are needed when handling.",
    applications: [
      "Flame retardant production",
      "Pharmaceutical intermediates",
      "Crop protection chemicals",
      "Specialty fluids",
      "Chemical synthesis"
    ],
    suppliers: 410,
    formula: "POCl₃",
    cas: "10025-87-3",
    weight: "153.33 g/mol",
    appearance: "Colorless to yellow fuming liquid"
  },
  "n-methyl-2-pyrrolidone": {
    name: "N-Methyl-2-Pyrrolidone",
    description: "N-methyl-2-pyrrolidone is an important solvent in many industries, including pharmaceuticals, electronics, and petrochemicals. The lithium-ion battery production is one of its major applications. The rising production of electric vehicles fuels demand for NMP through battery production.",
    applications: [
      "Lithium-ion battery production",
      "Electronics industry solvent",
      "Petrochemical processing",
      "Pharmaceutical extraction",
      "Paint and coating removal"
    ],
    suppliers: 590,
    formula: "C₅H₉NO",
    cas: "872-50-4",
    weight: "99.13 g/mol",
    appearance: "Colorless to light yellow liquid"
  },
  "tetrahydrofuran": {
    name: "Tetrahydrofuran",
    description: "In the Polytetramethylene Ether Glycol (PTMEG) production, THF serves as a critical raw material required for synthesizing this polymer, which is widely used in making spandex fibers, polyurethane elastomers, and copolyesters. THF's remarkable ability to dissolve a wide range of materials makes it valuable in pharmaceutical formulations, adhesives, and coatings.",
    applications: [
      "PTMEG production for spandex",
      "Pharmaceutical solvent",
      "Adhesive formulations",
      "PVC cement solvent",
      "Chemical reaction medium"
    ],
    suppliers: 670,
    formula: "C₄H₈O",
    cas: "109-99-9",
    weight: "72.11 g/mol",
    appearance: "Colorless liquid"
  },
  "morpholine": {
    name: "Morpholine",
    description: "Morpholine and its derivatives are used as solvents, rubber additives, optical brighteners, antioxidants and corrosion inhibitors. It's used as chemical emulsifier in the preparation of wax coating for vegetables and fruits. Morpholine is also used as feedstock to produce ethyleneimine (EI) for manufacturing polymers & Resins.",
    applications: [
      "Corrosion inhibitor",
      "Rubber accelerator",
      "Agricultural coating emulsifier",
      "Optical brightener production",
      "Pharmaceutical intermediate"
    ],
    suppliers: 440,
    formula: "C₄H₉NO",
    cas: "110-91-8",
    weight: "87.12 g/mol",
    appearance: "Colorless liquid"
  },
  "ethylene-oxide": {
    name: "Ethylene Oxide",
    description: "Ethylene oxide is used to make various chemical products such as detergents, thickeners, solvents, plastics and chemicals like ethanolamines and ethylene glycol. The major use is in making ethylene glycol for products like glycol ethers, diethyl ether and polyester fibres. Applications span automotive, cleaning industry, textiles and medical sectors.",
    applications: [
      "Ethylene glycol production",
      "Surfactant manufacturing",
      "Sterilizing agent for medical equipment",
      "Polyester fiber production",
      "Solvent production"
    ],
    suppliers: 830,
    formula: "C₂H₄O",
    cas: "75-21-8",
    weight: "44.05 g/mol",
    appearance: "Colorless gas"
  },
  "propylene-oxide": {
    name: "Propylene Oxide",
    description: "Propylene Oxide (PO) is a highly reactive, colorless, highly flammable liquefied organic bond which is a basic component for various applications. It's mainly used for the production of propylene glycol, and as an intermediate for polyetheroles for polyurethane foams. It's also used for production of carbonates, amines and ether.",
    applications: [
      "Propylene glycol production",
      "Polyurethane foam manufacturing",
      "Polyether polyols synthesis",
      "Glycol ethers production",
      "Petroleum demulsifier"
    ],
    suppliers: 720,
    formula: "C₃H₆O",
    cas: "75-56-9",
    weight: "58.08 g/mol",
    appearance: "Colorless liquid"
  },
  "propylene-glycol": {
    name: "Propylene Glycol",
    description: "Propylene glycol is used in various automotive, food and beverage, construction, and pharmaceutical applications. It's widely used as a solvent and emulsifier for stabilizing fluids and dissolving ingredients. The application has significantly increased in the food and beverage sector where it acts as anti-caking agent, texturizer, stabilizer, and thickener.",
    applications: [
      "Food and beverage additive",
      "Pharmaceutical solvent",
      "Antifreeze formulations",
      "Cosmetic ingredient",
      "Resin production"
    ],
    suppliers: 980,
    formula: "C₃H₈O₂",
    cas: "57-55-6",
    weight: "76.09 g/mol",
    appearance: "Colorless viscous liquid"
  },
  "monoethylene-glycol": {
    name: "Monoethylene Glycol",
    description: "Monoethylene glycol (MEG) is a colorless, odorless, hygroscopic liquid largely utilized as a raw material in the manufacture of polyester fibers, resins, and antifreeze compositions. It's an essential ingredient in the production of polyethylene terephthalate (PET), used to make plastic bottles, packaging materials, and textiles.",
    applications: [
      "PET plastic production",
      "Antifreeze formulations",
      "Polyester fiber manufacturing",
      "Hydraulic brake fluids",
      "Resin production"
    ],
    suppliers: 1100,
    formula: "C₂H₆O₂",
    cas: "107-21-1",
    weight: "62.07 g/mol",
    appearance: "Colorless liquid"
  },
  "diethylene-glycol": {
    name: "Diethylene Glycol",
    description: "DEG is a clear, colorless, odorless liquid soluble in water and many organic compounds. It has hygroscopic properties which make it useful in industrial applications. It's widely used in the plastic industry for plasticizers and in the tobacco industry as a humectant. It's also utilized as dehydrant in natural gas processing.",
    applications: [
      "Plasticizer production",
      "Tobacco humectant",
      "Natural gas dehydration",
      "Polyester resin modifier",
      "Solvent for printing inks"
    ],
    suppliers: 650,
    formula: "C₄H₁₀O₃",
    cas: "111-46-6",
    weight: "106.12 g/mol",
    appearance: "Colorless liquid"
  },
  "triethylene-glycol": {
    name: "Triethylene Glycol",
    description: "Triethylene glycol is used for manufacturing vinyl plasticizer, as intermediate in polyols and polyester resins, and as a solvent. It's also used for moisture elimination in air conditioning systems. Its key role in the petroleum industry makes it essential for natural gas dehydration.",
    applications: [
      "Natural gas dehydration",
      "Plasticizer production",
      "Air conditioning moisture control",
      "Solvent for printing inks",
      "Polyester resin production"
    ],
    suppliers: 580,
    formula: "C₆H₁₄O₄",
    cas: "112-27-6",
    weight: "150.17 g/mol",
    appearance: "Colorless liquid"
  },
  "acetonitrile": {
    name: "Acetonitrile",
    description: "Acetonitrile is a volatile, flammable and toxic chemical compound. It's widely used as an aprotic solvent in natural synthesis and refinement of butadiene. It's also utilized in perfumes, acrylic nail removers, batteries, and extraction of fatty acids from oils. It finds extensive applications across pharmaceuticals, agrochemicals, and automotive industries.",
    applications: [
      "Pharmaceutical solvent",
      "HPLC mobile phase",
      "Extraction of fatty acids",
      "Battery electrolyte",
      "Perfume manufacturing"
    ],
    suppliers: 710,
    formula: "C₂H₃N",
    cas: "75-05-8",
    weight: "41.05 g/mol",
    appearance: "Colorless liquid"
  }
};


export default function ChemicalPage(props: any) {
  const chemical = chemicalData[props.params.chemical];

  if (!chemical) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      <AppNavigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              {chemical.name}
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300">
              Industrial Applications & Technical Information
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Overview */}
          <div className="lg:col-span-2">
            <div className="max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Overview
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {chemical.description}
              </p>

              <h2 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white">
                Key Applications
              </h2>
              <ul className="mt-4 space-y-3">
                {chemical.applications.map((app, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">{app}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Suppliers & Search */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Find Suppliers
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Search in our vast supplier database for {chemical.name}. Get complete Access Now
              </p>
              <div className="mt-6">
                <a
                  href={`/?q=${encodeURIComponent(chemical.name)}`}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
                >
                  Search Suppliers
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Technical Information
              </h3>
              <dl className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-300">Chemical Formula</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{chemical.formula}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-300">CAS Number</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{chemical.cas}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-300">Molecular Weight</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{chemical.weight}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-300">Appearance</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{chemical.appearance}</dd>
                </div>
              </dl>
            </div>

          </div>
        </div>

        {/* Safety Information */}
        <div className="mt-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Safety Information
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Handling Precautions</h3>
              <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Use appropriate PPE (gloves, goggles, face shield)</li>
                <li>• Work in well-ventilated areas or fume hoods</li>
                <li>• Avoid contact with skin, eyes, and clothing</li>
                <li>• Use corrosion-resistant equipment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Storage Guidelines</h3>
              <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Store in cool, dry, well-ventilated area</li>
                <li>• Keep away from incompatible materials</li>
                <li>• Use containers made of corrosion-resistant materials</li>
                <li>• Follow local regulations for chemical storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

       {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Elate Chem</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Effective & user-friendly chemical sourcing platform for buyers.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <div className="space-y-2">
                  {[
                    ['Home', '/'],
                    ['About', '/about'],
                    ['Contact', '/contact'],
                  ].map(([title, url]) => (
                    <a key={title} href={url} className="block text-gray-400 hover:text-white transition-colors">
                      {title}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <div className="space-y-2">
                  {[
                    ['Privacy & Policy', '/privacy&policy'],
                    ['Terms of Service', '/termsofservice'],
                  ].map(([title, url]) => (
                    <a key={title} href={url} className="block text-gray-400 hover:text-white transition-colors">
                      {title}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Socials Connect</h4>
                <div className="flex space-x-4">
                  {['Coming Soon'].map((platform) => (
                    <a key={platform} href="#" className="text-gray-400 hover:text-white transition-colors">
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 py-8 text-center">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Elate Chem. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

    </div>
  );
}

// Generate static paths for all chemicals
export async function generateStaticParams() {
  return Object.keys(chemicalData).map(chemical => ({
    chemical,
  }));
}

// Set dynamic metadata
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const chemical = chemicalData[params.chemical];

  if (!chemical) {
    return {
      title: "Chemical Not Found",
      description: "The requested chemical application was not found"
    };
  }

  return {
    title: `${chemical.name} Applications | Elate Chem`,
    description: `Learn about industrial applications and uses of ${chemical.name} in various sectors. Find suppliers and technical information.`,
    openGraph: {
      title: `${chemical.name} Applications | Elate Chem`,
      description: `Learn about industrial applications and uses of ${chemical.name} in various sectors.`,
      images: [
        {
          url: `/chemicals/${params.chemical}.jpg`,
          width: 800,
          height: 600,
          alt: chemical.name,
        },
      ],
    },
  };
}