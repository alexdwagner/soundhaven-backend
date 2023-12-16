import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, UserService, PrismaService, JwtService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('should return JWT tokens on successful login', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201);

    expect(loginResponse.body).toHaveProperty('access_token');
    expect(loginResponse.body).toHaveProperty('refresh_token');
  });

  // Additional tests...

  afterAll(async () => {
    await app.close();
  });
});
