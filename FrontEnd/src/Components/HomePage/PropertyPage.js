import React from "react";
import "./PropertyPage.css";

const PropertyPage = () => {
  const properties = [
    {
     
      images: [
        "/images/829c32bb25c54ef5055cb36366b0fc11.jpg",
        "/images/3e5b370ca9dc404759831ac201fe50b5.jpg"
      ],
      
    },
    {
     
      images: [
        "/images/3e5b370ca9dc404759831ac201fe50b5.jpg",
        "/images/568971502.jpg"
      ],
     
    },
    {
     
      images: [
        "/images/89c1dfaf3e2bf035718cf2a76a16fd38.jpg"
      ],
    
    },
    {
    
      images: [
        "/images/bioclimatic-tropical-villa-in-vietnam-t3-architects-plus-kanopea-architecture-studio_4.jpg"
      ],
     
    }
  ];

  return (
    <div className="property-page">
      
      
      <div className="properties-horizontal-scroll">
        {properties.map((property) => (
          <div key={property.id} className="property-card-horizontal">
            <div className="property-image-container">
              <img 
                src={property.images[0]} 
                alt={property.title}
                className="property-main-image"
              />
            </div>
           
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyPage;