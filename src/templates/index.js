import { newSlide } from '../model.js';

export const pedagogical = {
  'Clase magistral': ['cover', 'section', 'content', 'columns', 'conclusions', 'closing'],
  'Taller': ['cover', 'content', 'activity', 'question', 'conclusions', 'closing'],
  'Aprendizaje basado en problemas': ['cover', 'question', 'activity', 'columns', 'conclusions', 'closing'],
  'Clase interactiva': ['cover', 'question', 'activity', 'content', 'activity', 'closing'],
  'Presentación científica': ['cover', 'section', 'content', 'data', 'conclusions', 'closing'],
  'Defensa de tesis': ['cover', 'section', 'content', 'data', 'conclusions', 'closing'],
  'Conferencia TED-style': ['cover', 'quote', 'content', 'image', 'conclusions', 'closing'],
  'Presentación de proyecto': ['cover', 'section', 'columns', 'data', 'conclusions', 'closing'],
  'Resultados de investigación': ['cover', 'content', 'data', 'data', 'conclusions', 'closing'],
  'Introducción de asignatura': ['cover', 'content', 'section', 'question', 'conclusions', 'closing']
};
export function templateSlides(name) { return pedagogical[name].map(newSlide); }
