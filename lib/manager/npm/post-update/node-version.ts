import { validRange } from 'semver';
import { logger } from '../../../logger';
import { getSiblingFileName, readLocalFile } from '../../../util/fs';
import { PostUpdateConfig } from '../../common';

async function getNodeFile(filename: string): Promise<string> | null {
  try {
    const constraint = (await readLocalFile(filename, 'utf8'))
      .split('\n')[0]
      .replace(/^v/, '');
    if (validRange(constraint)) {
      logger.debug(`Using node constraint "${constraint}" from ${filename}`);
      return constraint;
    }
  } catch (err) {
    // do nothing
  }
  return null;
}

async function getPackageJsonConstraint(
  filename: string
): Promise<string> | null {
  try {
    const pj = JSON.parse(await readLocalFile(filename, 'utf8'));
    const constraint = pj?.engines?.node;
    if (constraint && validRange(constraint)) {
      logger.debug(`Using node constraint "${constraint}" from package.json`);
      return constraint;
    }
  } catch (err) {
    // do nothing
  }
  return null;
}

export async function getNodeConstraint(
  config: PostUpdateConfig
): Promise<string> | null {
  const { packageFile } = config;
  const constraint =
    (await getNodeFile(getSiblingFileName(packageFile, '.nvmrc'))) ||
    (await getNodeFile(getSiblingFileName(packageFile, '.node-version'))) ||
    (await getPackageJsonConstraint(packageFile));
  if (!constraint) {
    logger.debug('No node constraint found - using latest');
  }
  return constraint;
}
