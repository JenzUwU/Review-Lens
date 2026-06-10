import Papa from 'papaparse';

const REVIEW_COLUMN_NAMES = [
  'review',
  'reviews',
  'review_text',
  'review text',
  'text',
  'comment',
  'comments',
  'content',
];

function findReviewColumn(fields = []) {
  return fields.find((field) =>
    REVIEW_COLUMN_NAMES.includes(field.trim().toLowerCase()),
  );
}

export function parsePastedReviews(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseReviewCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: ({ data, errors, meta }) => {
        if (errors.length) {
          reject(new Error(errors[0].message || 'The CSV could not be read.'));
          return;
        }

        const reviewColumn = findReviewColumn(meta.fields);

        if (!reviewColumn) {
          reject(
            new Error(
              'CSV must contain a review column, such as "review", "review_text", "text", or "comment".',
            ),
          );
          return;
        }

        const reviews = data
          .map((row) => String(row[reviewColumn] ?? '').trim())
          .filter(Boolean);

        if (!reviews.length) {
          reject(new Error(`The "${reviewColumn}" column does not contain reviews.`));
          return;
        }

        resolve(reviews);
      },
      error: (error) => reject(error),
    });
  });
}
