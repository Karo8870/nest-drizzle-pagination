import { HttpException } from '@nestjs/common';

export function throwBadRequestException(message?: any): never {
	throw new HttpException(
		{
			error: 'Bad request',
			statusCode: 400,
			message
		},
		400
	);
}
