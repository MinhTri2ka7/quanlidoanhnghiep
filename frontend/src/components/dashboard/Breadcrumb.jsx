import { Link } from "react-router-dom";

function Breadcrumb({ items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-5" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-darkTextGray">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
            {isLast ? (
              <span className="text-darkText font-medium">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="text-darkTextGray hover:text-primaryBlue transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
