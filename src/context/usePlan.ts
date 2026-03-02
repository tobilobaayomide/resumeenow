import { useContext } from 'react';
import { PlanContext } from './plan-context';

export const usePlan = () => useContext(PlanContext);
