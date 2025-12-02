-- Kategorileri ve kitap sayılarını kontrol et
SELECT 
    c.id,
    c.name,
    c.name_translations,
    c.description,
    c.icon,
    c.book_count,
    COUNT(DISTINCT b.id) as actual_book_count
FROM categories c
LEFT JOIN books b ON b.category = c.name
GROUP BY c.id, c.name, c.name_translations, c.description, c.icon, c.book_count
ORDER BY c.name;

-- Her kategorideki kitapları göster
SELECT 
    c.name as category,
    b.title as book_title,
    b.author,
    b.cover_image_url
FROM categories c
LEFT JOIN books b ON b.category = c.name
ORDER BY c.name, b.title;
