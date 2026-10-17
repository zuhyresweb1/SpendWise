import {
  Home,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Film,
  HeartPulse,
  Tag,
  Plane,
  GraduationCap,
  CreditCard,
  Sparkles,
  Gift,
  TrendingUp,
  Folder,
} from 'lucide-react';
import { ExpenseCategory, CATEGORY_DETAILS } from '../types/expense';

interface CategoryIconProps {
  category: ExpenseCategory;
  className?: string;
  size?: number;
}

export function CategoryIcon({ category, className = '', size = 18 }: CategoryIconProps) {
  const details = CATEGORY_DETAILS[category] || CATEGORY_DETAILS['Miscellaneous'];

  const getIcon = () => {
    switch (details.icon) {
      case 'Home':
        return <Home size={size} />;
      case 'ShoppingBag':
        return <ShoppingBag size={size} />;
      case 'Utensils':
        return <Utensils size={size} />;
      case 'Car':
        return <Car size={size} />;
      case 'Zap':
        return <Zap size={size} />;
      case 'Film':
        return <Film size={size} />;
      case 'HeartPulse':
        return <HeartPulse size={size} />;
      case 'Tag':
        return <Tag size={size} />;
      case 'Plane':
        return <Plane size={size} />;
      case 'GraduationCap':
        return <GraduationCap size={size} />;
      case 'CreditCard':
        return <CreditCard size={size} />;
      case 'Sparkles':
        return <Sparkles size={size} />;
      case 'Gift':
        return <Gift size={size} />;
      case 'TrendingUp':
        return <TrendingUp size={size} />;
      default:
        return <Folder size={size} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg p-2 ${className}`}
      style={{
        backgroundColor: details.bg,
        color: details.color,
      }}
    >
      {getIcon()}
    </span>
  );
}
