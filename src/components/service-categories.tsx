import Image from "next/image";

import { customerCategories } from "@/features/customer/config";
export const serviceCategories = customerCategories;
export function ServiceCategories() {
  return <div className="service-grid">{serviceCategories.map((category) => <div className="service-tile" key={category.slug}><span className="service-icon"><Image src={`/icons/services/${category.slug}.svg`} alt="" width={24} height={24}/></span><h3>{category.label}</h3></div>)}</div>;
}
