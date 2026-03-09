export const ART_CONFIG = {
  name: 'Art',
  prefix: 'ART',
  category: 'arts',
  priority: 8,
  totalQuestions: 40,
  topics: {
    'CLASSIFICATION OF ART': {
      subtopics: [
        'Visual Arts: (Fine and Applied Arts)',
        'Performing Arts: (Music, Dance and Drama)',
        'Literary Arts: (Poetry, Prose, Recital) etc.',
      ],
      objectives: [
        'differentiate between the three branches of art;',
      ],
    },
    'ELEMENTS AND PRINCIPLES OF DESIGN': {
      subtopics: [
        'Elements: line, colour, shape, form, texture, tone, value, space etc.',
        'Principles: balance, rhythm, proportion, harmony, contrast, repetition, dominance, variety, etc.',
      ],
      objectives: [
        'identify the elements of design;',
        'analyse the principles of design;',
      ],
    },
    'ART TERMS': {
      subtopics: [
        'Pigments, motif, greenware, armature, silhouette, chiaroscuro, cire-perdue, terra-cotta etc.',
      ],
      objectives: [
        'identify art terms;',
        'link the terms to their areas of art;',
        'use the terms in analyzing artworks.',
      ],
    },
    'HISTORICAL DIMENSIONS OF ART': {
      subtopics: [
        'Prehistoric, Greek and Roman Art;',
        'Medieval Art: architecture, surface decorations and calligraphy;',
        'Renaissance Art and Artists: Giotto Di Bondone, Michelangelo Buonarroti, Leonardo da Vinci and Raphael (Raffaello Santi); e.t.c.',
        '19th and 20th Century Art Movements; Impressionism, Realism, Futurism, Cubism, Bauhaus, Pop art, Abstract Expressionism and Fauvism.',
      ],
      objectives: [
        'compare their materials, styles and techniques;',
        'classify the periods and styles with emphasis on architecture, surface decoration and calligraphy;',
        'compare the artists, their works and styles;',
        'differentiate between the various art movements;',
      ],
    },
    'TRADITIONAL AFRICAN ART': {
      subtopics: [
        'Egypt, Ashanti, Dogon, Mossi, Fon, Senufo, Bambara, Mende, Kissi, Bamileke and Bakumba.',
      ],
      objectives: [
        'analyze their styles techniques, innovations and influences;',
      ],
    },
    'TRADITIONAL NIGERIAN ART': {
      subtopics: [
        'Nok, Igbo-Ukwu, Ife, Benin, Esie, Igala, Jukun, Akwanshi, and Mbari.',
      ],
      objectives: [
        'categorize works in terms of style, materials and locations;',
        'analyze the works in terms of functions, characteristics and locations;',
        'trace the origins, locations and styles;',
      ],
    },
    'NIGERIAN CRAFTS': {
      subtopics: [
        'Pottery, woodworks, cloth-weaving, carving, leather works, metal works, beadworks, body decoration, mat and cane weaving.',
      ],
      objectives: [],
    },
    'DEVELOPMENT IN CONTEMPORARY NIGERIAN ARTS AND ARTISTS': {
      subtopics: [
        'Art Schools: Zaria, Nsukka, Osogbo group etc.',
        'Nigerian artists and art educators; Aina Onabolu, Ben Enwonwu, S. I. Wangboje, Jimoh Akolo, Dele Jegede etc.',
        'Museums, galleries and art centres;',
        'Art institutions, cultural art centres, national art organizations – Nigerian Society for Education through Arts (NSEA), Society for Nigerian Artists (S.N.A), National Council for Arts and Culture (N.C.A.C), etc.',
        'Major Festivals: Argungu Fishing Festival, Eyo, Egungun, Iri-ji (New Yam), Durbar, Igue, Ekpo, Odo, etc.',
      ],
      objectives: [
        'determine the influence of the art schools and groups towards the development of art;',
        'assess the artists in terms of their works, specializations, techniques and styles;',
        'analyze the functions of museums, galleries, art centres and art institutions;',
        'evaluate their impact on the development of art;',
        'assess their roles and functions;',
        'examine the characteristics of major festivals of art and culture.',
      ],
    },
    'ARTISTIC SKILLS, TECHNIQUES AND PROCESSES': {
      subtopics: [
        'Two-Dimensional Art: drawing, painting, graphics and textile design.',
        'Perspective:',
        'Linear, angular, aerial, parallel etc.',
        'Perspective terms: foreground, picture plane, eye-level, vanishing point, foreshortening, optical illusion, depth etc.',
        'Sculpture, Ceramics and Crafts,',
        'Computer Graphics:',
        'CorelDraw',
      ],
      objectives: [
        'the techniques, skills and processes with emphasis on tone, composition and colour application;',
        'the types of perspective;',
        'the use of perspective rules and terms;',
        'techniques, skills and processes;',
        'the basic tools of designs',
      ],
    },
    'TOOLS, MATERIALS AND EQUIPMENT': {
      subtopics: [
        'Two-Dimensional Art Tools: brushes, lino cutters, drawing instruments, calligraphic pens, sharpeners etc.',
        'Two-dimensional Art Materials: pencils charcoal, pastel, crayon, fixative, fabric, dyes, lino, wood blocks etc.',
        'Two-Dimensional Art Equipment: air compressor, spray gun, enlarger, computer etc.',
        'Improvisation of tools, materials and equipment;',
        'Two-Dimensional Art: colours, brushes, calligraphic pens etc.',
        'Three-Dimensional Art: spatula, kiln, beater, etc.',
      ],
      objectives: [
        'maintain art tools and art materials;',
        'use art materials and tools;',
        'operate and maintain art equipment;',
        'improvise alternative tools, materials and equipment;',
      ],
    },
    'ART APPRECIATION': {
      subtopics: [
        'Man-made objects: architecture, sculpture etc.',
        'Natural phenomena: Zuma Rock, Ikogosi Warm Springs, etc.',
      ],
      objectives: [
        'identify the aesthetic qualities of natural and man-made aesthetic phenomena in Nigerian environment;',
        'differentiate between natural and man-made aesthetic phenomena;',
      ],
    },
    'MEANING AND FUNCTIONS OF ART IN SOCIETY': {
      subtopics: [
        'Meaning of art;',
        'Functions of art in the society: religious, social, cultural, political, therapeutic and economic needs.',
        'Functions of art in electronic and print media: advertisement, education, recreation etc.',
      ],
      objectives: [
        'examine the meaning and functions of art;',
        'use art to enhance societal values;',
        'assess the role of art in electronic and print media;',
      ],
    },
    'ART ENTREPRENEURSHIP': {
      subtopics: [
        'Job prospects in the Visual Arts: Ceramist, Curator, Textile designer, Industrial designer, Sculptor, Photographer, Cartoonist, Illustrator etc.',
      ],
      objectives: [
        'identify job opportunities in the Visual Arts.',
      ],
    },
  },
} as const

export type ArtTopic = keyof typeof ART_CONFIG.topics