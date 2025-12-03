-- Check books table category field and its values
SELECT 
  id,
  title,
  category,
  author
FROM books
LIMIT 5;

-- Also check categories table
SELECT * FROM categories;
