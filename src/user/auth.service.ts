import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorType, UserSignUpType, UserType } from './types/user.type';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SendgridService } from 'src/sendgrid/sendgrid.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendgridService,
  ) {}

  // method to create a new User in database
  async signup(user: UserDto): Promise<UserSignUpType | ErrorType> {
    const { email, name, password } = user;
    // see if email is in use
    const findUser = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if (findUser) {
      return {
        message: 'User is already exists.',
        type: 'error',
      };
    }

    // send email confirmation email to user and encode user in JWT token and attach it to the email
    // generate a JWT token
    const token = await this.jwtService.signAsync(
      { email, name, password },
      {
        secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION'),
        expiresIn: '10h',
      },
    );

    // prepare a mail to send with details
    const mail = {
      to: email,
      subject: 'Verify your email address',
      from: 'swt@real-cnt.com', // Fill it with your validated email on SendGrid account
      text: 'Email verifiation email',
      html: `
        <div>
          <h1>Click this URL to verify your email address for registration.</h1> 
          <p>${this.configService.get<string>(
            'CLIENT_URL',
          )}/email_verification/${token}</p> 
        </div> 
      `,
    };

    try {
      // send mail with sendgreid API
      await this.sendgridService.send(mail);
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return {
      message: 'Email has been sent.',
      status: 'ok',
    };
  }

  // verify user with given token if user valid then add it to the database and successfully do the registration
  async verifyUser(token: string): Promise<UserType> {
    try {
      const { name, email, password } = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION'),
        },
      );

      // check if the user is already verified and trying to re-use the link
      const findUser = await this.prismaService.user.findUnique({
        where: {
          email: email,
        },
      });

      if (findUser) {
        throw new UnauthorizedException();
      }

      // Hash the users password
      const hashedPassword = await bcrypt.hash(password, 10);

      // create a new user and save it
      const newUser = await this.prismaService.user.create({
        data: {
          name: name,
          email: email,
          password: hashedPassword,
        },
      });
      // omitting password from user fetched from database
      type UserPreview = Omit<UserType, 'password'>;

      const validUser: UserPreview = {
        email: newUser.email,
        name: newUser.name,
      };

      return validUser;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  // method to signin a user with email and password
  async signin(user: UserDto): Promise<UserType | ErrorType> {
    // see if user exists or not with given email
    const findUser = await this.prismaService.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (!findUser) {
      return {
        message: 'User not found.',
        type: 'error',
      };
    }

    // compare the password with bcrypt
    const isMatch = await bcrypt.compare(user.password, findUser.password);

    if (isMatch) {
      // password is okay let's login by creating a JWT token

      // omitting password from user fetched from database
      type UserPreview = Omit<UserType, 'password'>;

      const validUser: UserPreview = {
        email: findUser.email,
        name: findUser.name,
        token: 'sample token',
      };

      return validUser;
    } else {
      return {
        message: 'Credentials are not valid',
        type: 'error',
      };
    }
  }
}
