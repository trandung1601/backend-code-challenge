import { Router } from 'express';
import { bookController } from '../controllers/book.controller';
import { validate } from '../../../middlewares/validate.middleware';
import { parseMultipartBookUpload } from '../../../middlewares/multipart.middleware';
import {
  createBookSchema,
  updateBookSchema,
  listBooksQuerySchema,
  idParamSchema,
} from '../validators/book.validator';

const router = Router();

router.post('/', parseMultipartBookUpload, validate({ body: createBookSchema }), bookController.create);
router.get('/', validate({ query: listBooksQuerySchema }), bookController.list);
router.get('/:id', validate({ params: idParamSchema }), bookController.getOne);
router.patch(
  '/:id',
  parseMultipartBookUpload,
  validate({ params: idParamSchema, body: updateBookSchema }),
  bookController.update,
);
router.delete('/:id', validate({ params: idParamSchema }), bookController.remove);

export default router;
