import {
  AbstractController,
  AbstractRequest,
  AbstractResponse,
  Get,
  Post,
} from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

interface PostBody {
  param1: string;
  param2: string;
}

@Service('main-controller')
export default class MainController extends AbstractController {
  @Get('/')
  index(_request: AbstractRequest, response: AbstractResponse) {
    return new Promise((resolve) => {
      setTimeout(() => {
        response
          .setBody({
            message: 'Hello world!',
          })
          .end();
        resolve(undefined);
      }, 500);
    });
  }

  @Get('/test/:param1/:param2')
  test(request: AbstractRequest, response: AbstractResponse) {
    response.setBody({
      param1: request.getParams().param1,
      param2: request.getParams().param2,
    });
  }

  @Post('/test-post')
  testPost(request: AbstractRequest<PostBody>, response: AbstractResponse) {
    const { param1, param2 } = request.getBody();
    response.setBody({
      message: `${param1} ${param2}`,
    });
  }
}
